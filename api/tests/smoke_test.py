import os
import sys
import time
import requests

BASE_URL = os.environ.get("AZURESTAY_API_URL", "http://localhost:5080")
results = []


def record(name: str, passed: bool, detail: str = "") -> None:
    status = "PASS" if passed else "FAIL"
    suffix = f" - {detail}" if detail else ""
    print(f"[{status}] {name}{suffix}")
    results.append(passed)


def main() -> int:
    session = requests.Session()
    unique_email = f"smoke_{int(time.time() * 1000)}@azurestay.vn"
    password_v1 = "SmokeTest@123"
    password_v2 = "SmokeTest@456"

    # 1. Health check
    r = requests.get(f"{BASE_URL}/api/health", timeout=10)
    ok_health = r.status_code == 200 and r.json().get("status") == "ok" and r.json().get("db") is True
    record("GET /api/health -> 200 {status: ok, db: true}", ok_health, f"code={r.status_code}, body={r.text}")

    # 2. Chưa có token gọi /me -> 401
    r = requests.get(f"{BASE_URL}/api/auth/me", timeout=10)
    record("GET /api/auth/me without token -> 401", r.status_code == 401, f"code={r.status_code}")

    # 3. Đăng ký user mới -> 201 (không trả accessToken)
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": unique_email, "password": password_v1, "fullName": "Người Dùng Smoke Test", "phone": "0909123456"},
        timeout=10,
    )
    reg_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    ok_reg = (
        r.status_code == 201
        and reg_body.get("email") == unique_email
        and reg_body.get("role") == "Customer"
        and "accessToken" not in reg_body
    )
    record("POST /api/auth/register -> 201 user without token", ok_reg, f"code={r.status_code}")

    # 4. Đăng ký trùng email -> 409
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": unique_email, "password": password_v1, "fullName": "Trùng Email"},
        timeout=10,
    )
    record("POST /api/auth/register duplicate email -> 409", r.status_code == 409, f"code={r.status_code}")

    # 5. Đăng nhập sai mật khẩu -> 401
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": unique_email, "password": "WrongPassword123"},
        timeout=10,
    )
    record("POST /api/auth/login wrong password -> 401", r.status_code == 401, f"code={r.status_code}")

    # 6. Đăng nhập thành công -> 200 + accessToken + cookie refreshToken
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": unique_email, "password": password_v1},
        timeout=10,
    )
    login_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    access_token = login_body.get("accessToken")
    old_refresh_cookie = session.cookies.get("refreshToken")
    ok_login = r.status_code == 200 and bool(access_token) and bool(old_refresh_cookie)
    record("POST /api/auth/login -> 200 accessToken + refresh cookie", ok_login, f"code={r.status_code}")

    # 7. GET /api/auth/me với token -> 200
    headers = {"Authorization": f"Bearer {access_token}"}
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers, timeout=10)
    ok_me = r.status_code == 200 and r.json().get("email") == unique_email
    record("GET /api/auth/me with token -> 200", ok_me, f"code={r.status_code}")

    # 8. PUT /api/auth/me cập nhật profile -> 200
    r = requests.put(
        f"{BASE_URL}/api/auth/me",
        headers=headers,
        json={"fullName": "Tên Đã Cập Nhật", "phone": "0911222333"},
        timeout=10,
    )
    ok_put_me = r.status_code == 200 and r.json().get("fullName") == "Tên Đã Cập Nhật"
    record("PUT /api/auth/me -> 200 updated profile", ok_put_me, f"code={r.status_code}")

    # 9. POST /api/auth/refresh -> 200 accessToken mới + xoay cookie
    r = session.post(f"{BASE_URL}/api/auth/refresh", timeout=10)
    refresh_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    new_access_token = refresh_body.get("accessToken")
    new_refresh_cookie = session.cookies.get("refreshToken")
    ok_refresh = (
        r.status_code == 200
        and bool(new_access_token)
        and bool(new_refresh_cookie)
        and new_refresh_cookie != old_refresh_cookie
    )
    record("POST /api/auth/refresh -> 200 rotated token", ok_refresh, f"code={r.status_code}")

    # 10. Dùng lại refresh token cũ đã bị revoke -> 401
    r = requests.post(f"{BASE_URL}/api/auth/refresh", cookies={"refreshToken": old_refresh_cookie or ""}, timeout=10)
    record("POST /api/auth/refresh with revoked token -> 401", r.status_code == 401, f"code={r.status_code}")

    # 11. Đổi mật khẩu -> 200
    headers = {"Authorization": f"Bearer {new_access_token}"}
    r = session.post(
        f"{BASE_URL}/api/auth/change-password",
        headers=headers,
        json={"currentPassword": password_v1, "newPassword": password_v2},
        timeout=10,
    )
    record("POST /api/auth/change-password -> 200", r.status_code == 200, f"code={r.status_code}")

    # 12. Đăng nhập lại bằng mật khẩu mới -> 200
    r = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": unique_email, "password": password_v2},
        timeout=10,
    )
    relogin_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    relogin_token = relogin_body.get("accessToken")
    record("POST /api/auth/login with new password -> 200", r.status_code == 200 and bool(relogin_token), f"code={r.status_code}")

    # 13. Đăng xuất -> 200, sau đó refresh bị 401
    r = session.post(
        f"{BASE_URL}/api/auth/logout",
        headers={"Authorization": f"Bearer {relogin_token}"},
        timeout=10,
    )
    record("POST /api/auth/logout -> 200", r.status_code == 200, f"code={r.status_code}")

    r = session.post(f"{BASE_URL}/api/auth/refresh", timeout=10)
    record("POST /api/auth/refresh after logout -> 401", r.status_code == 401, f"code={r.status_code}")

    # 14. Kiểm tra tài khoản seed (admin / owner / demo)
    for email, pwd, expected_role in [
        ("admin@azurestay.vn", "Admin@12345", "Admin"),
        ("owner@azurestay.vn", "Owner@12345", "Owner"),
        ("demo@azurestay.vn", "Demo@12345", "Customer"),
    ]:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pwd}, timeout=10)
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        ok_seed = r.status_code == 200 and body.get("user", {}).get("role") == expected_role
        record(f"Seed login {email} ({expected_role}) -> 200", ok_seed, f"code={r.status_code}")

    failed = sum(1 for ok in results if not ok)
    print(f"\nTong ket: {len(results) - failed}/{len(results)} PASS, {failed} FAIL")
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
