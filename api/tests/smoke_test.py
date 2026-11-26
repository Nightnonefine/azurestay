import os
import sys
import time
from datetime import datetime, timedelta, timezone
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
    seed_tokens = {}
    for email, pwd, expected_role in [
        ("admin@azurestay.vn", "Admin@12345", "Admin"),
        ("owner@azurestay.vn", "Owner@12345", "Owner"),
        ("demo@azurestay.vn", "Demo@12345", "Customer"),
    ]:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": pwd}, timeout=10)
        body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
        ok_seed = r.status_code == 200 and body.get("user", {}).get("role") == expected_role
        if ok_seed:
            seed_tokens[email] = body.get("accessToken")
        record(f"Seed login {email} ({expected_role}) -> 200", ok_seed, f"code={r.status_code}")

    # ==========================================================
    # Nhóm 1B: Khách sạn, loại phòng, tồn kho theo ngày, đặt phòng
    # ==========================================================
    vn_today = datetime.now(timezone(timedelta(hours=7))).date()
    future_in = (vn_today + timedelta(days=40)).isoformat()
    future_out = (vn_today + timedelta(days=42)).isoformat()
    past_in = (vn_today - timedelta(days=2)).isoformat()
    past_out = (vn_today - timedelta(days=1)).isoformat()

    # 15. Meta cities & amenities
    r = requests.get(f"{BASE_URL}/api/meta/cities", timeout=10)
    cities_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else []
    ok_cities = r.status_code == 200 and isinstance(cities_body, list) and len(cities_body) >= 5
    record("GET /api/meta/cities -> 200 list of cities", ok_cities, f"code={r.status_code}, count={len(cities_body) if isinstance(cities_body, list) else 0}")

    r = requests.get(f"{BASE_URL}/api/meta/amenities", timeout=10)
    amenities_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else []
    ok_amenities = r.status_code == 200 and isinstance(amenities_body, list) and any(a.get("code") == "wifi" for a in amenities_body)
    record("GET /api/meta/amenities -> 200 standardized amenities", ok_amenities, f"code={r.status_code}")

    # 16. Tìm khách sạn không lọc -> có items, total > 0
    r = requests.get(f"{BASE_URL}/api/hotels", timeout=10)
    all_hotels = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    total_all = all_hotels.get("total", 0)
    items_all = all_hotels.get("items", [])
    ok_all_hotels = r.status_code == 200 and total_all > 0 and len(items_all) > 0
    record("GET /api/hotels (unfiltered) -> 200 total > 0", ok_all_hotels, f"code={r.status_code}, total={total_all}")

    # 17. Lọc theo city và checkIn/checkOut/guests -> total <= total_all, priceFrom > 0
    r = requests.get(
        f"{BASE_URL}/api/hotels",
        params={"city": "Đà Nẵng", "checkIn": future_in, "checkOut": future_out, "guests": 2},
        timeout=10,
    )
    filtered_hotels = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    filtered_items = filtered_hotels.get("items", [])
    ok_filtered = (
        r.status_code == 200
        and 0 < filtered_hotels.get("total", 0) <= total_all
        and all(item.get("priceFrom", 0) > 0 for item in filtered_items)
    )
    record("GET /api/hotels filtered by city + dates + guests -> priceFrom > 0", ok_filtered, f"code={r.status_code}, total={filtered_hotels.get('total')}")

    # 18. GET /api/hotels/{slug} trả roomTypes không rỗng; slug sai -> 404
    target_slug = "azure-bay-resort-da-nang"
    r = requests.get(f"{BASE_URL}/api/hotels/{target_slug}", timeout=10)
    detail = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    room_types = detail.get("roomTypes", [])
    ok_detail = r.status_code == 200 and detail.get("slug") == target_slug and len(room_types) > 0
    record(f"GET /api/hotels/{target_slug} -> 200 with roomTypes", ok_detail, f"code={r.status_code}, rooms={len(room_types)}")

    r = requests.get(f"{BASE_URL}/api/hotels/slug-khong-ton-tai-999", timeout=10)
    record("GET /api/hotels/invalid-slug -> 404", r.status_code == 404, f"code={r.status_code}")

    # 19. Availability của một loại phòng: available = total - booked và khớp dữ liệu seed
    # Seed: Hotel 1 (azure-bay-resort-da-nang), RoomType 2 (Premier Hướng Biển): TotalRooms=8, Booking 12 (2026-12-01..2026-12-04, Confirmed, Rooms=2)
    r = requests.get(
        f"{BASE_URL}/api/hotels/{target_slug}/availability",
        params={"from": "2026-12-01", "to": "2026-12-04"},
        timeout=10,
    )
    avail_days = r.json() if r.headers.get("content-type", "").startswith("application/json") else []
    ok_seed_avail = False
    if r.status_code == 200 and isinstance(avail_days, list) and len(avail_days) == 3:
        ok_seed_avail = all(
            all(rt["available"] == rt["total"] - rt["booked"] for rt in day["roomTypes"])
            for day in avail_days
        )
        first_day_rt2 = next((rt for rt in avail_days[0]["roomTypes"] if rt["id"] == 2), None)
        ok_seed_avail = ok_seed_avail and first_day_rt2 is not None and first_day_rt2["total"] == 8 and first_day_rt2["booked"] == 2 and first_day_rt2["available"] == 6
    record("GET /api/hotels/{slug}/availability matches seed math (8 - 2 = 6)", ok_seed_avail, f"code={r.status_code}")

    # 20. Reviews của khách sạn -> 200
    r = requests.get(f"{BASE_URL}/api/hotels/{target_slug}/reviews", timeout=10)
    reviews_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    ok_reviews = r.status_code == 200 and reviews_body.get("total", 0) >= 1 and "***" in reviews_body["items"][0].get("guestName", "")
    record("GET /api/hotels/{slug}/reviews -> 200 masked guestName", ok_reviews, f"code={r.status_code}")

    # Lấy tồn kho hiện tại cho ngày future_in..future_out trước khi đặt phòng
    target_room_type_id = room_types[0]["id"] if room_types else 1
    r = requests.get(
        f"{BASE_URL}/api/hotels/{target_slug}/availability",
        params={"from": future_in, "to": future_out},
        timeout=10,
    )
    future_avail_days = r.json() if r.status_code == 200 else []
    avail_before = min(
        (rt["available"] for day in future_avail_days for rt in day["roomTypes"] if rt["id"] == target_room_type_id),
        default=0,
    )

    # 21. POST /api/bookings khi chưa có token -> 401
    booking_payload = {
        "roomTypeId": target_room_type_id,
        "checkIn": future_in,
        "checkOut": future_out,
        "rooms": 1,
        "adults": 2,
        "children": 0,
        "guestName": "Lê Hoàng Nam",
        "guestPhone": "0903000004",
        "guestEmail": "demo@azurestay.vn",
        "note": "Smoke test booking",
    }
    r = requests.post(f"{BASE_URL}/api/bookings", json=booking_payload, timeout=10)
    record("POST /api/bookings without token -> 401", r.status_code == 401, f"code={r.status_code}")

    # Đăng nhập customer A (demo@azurestay.vn) và customer B (khach2@azurestay.vn)
    token_a = seed_tokens.get("demo@azurestay.vn", "")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "khach2@azurestay.vn", "password": "Demo@12345"},
        timeout=10,
    )
    token_b = r.json().get("accessToken", "") if r.status_code == 200 else ""
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 22. Đặt phòng hợp lệ -> 201, đọc lại GET /api/bookings/{code} -> 200
    r = requests.post(f"{BASE_URL}/api/bookings", headers=headers_a, json=booking_payload, timeout=10)
    created_booking = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    booking_id = created_booking.get("id")
    booking_code = created_booking.get("code")
    ok_create = (
        r.status_code == 201
        and bool(booking_id)
        and bool(booking_code)
        and len(booking_code) == 8
        and created_booking.get("status") == "Pending"
        and created_booking.get("nights") == 2
    )
    record("POST /api/bookings valid -> 201 Pending", ok_create, f"code={r.status_code}, bookingCode={booking_code}")

    r = requests.get(f"{BASE_URL}/api/bookings/{booking_code}", headers=headers_a, timeout=10)
    ok_read_own = r.status_code == 200 and r.json().get("code") == booking_code
    record("GET /api/bookings/{code} by owner -> 200", ok_read_own, f"code={r.status_code}")

    r = requests.get(f"{BASE_URL}/api/bookings/my", headers=headers_a, params={"status": "Pending"}, timeout=10)
    my_body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
    ok_my = r.status_code == 200 and any(item.get("code") == booking_code for item in my_body.get("items", []))
    record("GET /api/bookings/my?status=Pending -> contains created booking", ok_my, f"code={r.status_code}")

    # 23. User B đọc đơn của user A -> 404
    r = requests.get(f"{BASE_URL}/api/bookings/{booking_code}", headers=headers_b, timeout=10)
    record("GET /api/bookings/{code} by other user -> 404", r.status_code == 404, f"code={r.status_code}")

    # 24. Đặt quá số phòng còn trống -> 400
    over_payload = dict(booking_payload, rooms=avail_before + 1)
    r = requests.post(f"{BASE_URL}/api/bookings", headers=headers_a, json=over_payload, timeout=10)
    record("POST /api/bookings over available rooms -> 400", r.status_code == 400, f"code={r.status_code}")

    # 25. checkOut <= checkIn -> 400; ngày trong quá khứ -> 400
    bad_dates_payload = dict(booking_payload, checkOut=future_in)
    r = requests.post(f"{BASE_URL}/api/bookings", headers=headers_a, json=bad_dates_payload, timeout=10)
    record("POST /api/bookings checkOut <= checkIn -> 400", r.status_code == 400, f"code={r.status_code}")

    past_payload = dict(booking_payload, checkIn=past_in, checkOut=past_out)
    r = requests.post(f"{BASE_URL}/api/bookings", headers=headers_a, json=past_payload, timeout=10)
    record("POST /api/bookings past checkIn -> 400", r.status_code == 400, f"code={r.status_code}")

    # 26. Huỷ đơn Pending -> 200 và GET lại thấy Cancelled; huỷ lần 2 -> 400
    r = requests.post(
        f"{BASE_URL}/api/bookings/{booking_id}/cancel",
        headers=headers_a,
        json={"reason": "Đổi kế hoạch chuyến đi"},
        timeout=10,
    )
    ok_cancel = r.status_code == 200 and r.json().get("status") == "Cancelled"
    record("POST /api/bookings/{id}/cancel Pending -> 200 Cancelled", ok_cancel, f"code={r.status_code}")

    r = requests.get(f"{BASE_URL}/api/bookings/{booking_code}", headers=headers_a, timeout=10)
    ok_get_cancelled = r.status_code == 200 and r.json().get("status") == "Cancelled"
    record("GET /api/bookings/{code} after cancel -> Cancelled", ok_get_cancelled, f"code={r.status_code}")

    r = requests.post(
        f"{BASE_URL}/api/bookings/{booking_id}/cancel",
        headers=headers_a,
        json={"reason": "Huỷ lần 2"},
        timeout=10,
    )
    record("POST /api/bookings/{id}/cancel second time -> 400", r.status_code == 400, f"code={r.status_code}")

    # Seed booking Id=1 (AZS10001) thuộc demo@azurestay.vn và đang Completed -> không thể huỷ (400)
    r = requests.post(
        f"{BASE_URL}/api/bookings/1/cancel",
        headers=headers_a,
        json={"reason": "Thử huỷ đơn đã hoàn tất"},
        timeout=10,
    )
    record("POST /api/bookings/1/cancel Completed -> 400", r.status_code == 400, f"code={r.status_code}")

    # 27. Sau khi huỷ, available tăng lại đúng số phòng ban đầu
    r = requests.get(
        f"{BASE_URL}/api/hotels/{target_slug}/availability",
        params={"from": future_in, "to": future_out},
        timeout=10,
    )
    after_days = r.json() if r.status_code == 200 else []
    avail_after = min(
        (rt["available"] for day in after_days for rt in day["roomTypes"] if rt["id"] == target_room_type_id),
        default=-1,
    )
    record("Availability restored after cancel", avail_after == avail_before, f"before={avail_before}, after={avail_after}")

    failed = sum(1 for ok in results if not ok)
    print(f"\nTong ket: {len(results) - failed}/{len(results)} PASS, {failed} FAIL")
    return 1 if failed > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
