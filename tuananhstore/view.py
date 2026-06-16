import google.generativeai as genai
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

# 1. Khai báo API Key của bạn
# (Lưu ý: Trong thực tế, bạn nên giấu mã này vào file .env cho an toàn)
genai.configure(api_key="ĐIỀN_API_KEY_CỦA_BẠN_VÀO_ĐÂY")

# 2. Tạo hàm xử lý tin nhắn
@csrf_exempt
def chatbot_api(request):
    if request.method == "POST":
        try:
            # Lấy tin nhắn khách hàng gửi lên từ file HTML
            data = json.loads(request.body)
            user_message = data.get("message", "")

            # 3. Khởi tạo mô hình Gemini 1.5 Flash với "Hệ tư tưởng"
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction="""
                Bạn là nhân viên tư vấn nhiệt tình của cửa hàng giày cao cấp SOLE. 
                Nhiệm vụ của bạn là tư vấn giày cho khách hàng dựa trên lịch sự, ngắn gọn và chuyên nghiệp.
                Chỉ trả lời các câu hỏi liên quan đến giày dép, thời trang, mua sắm.
                """
            )

            # 4. Gửi câu hỏi cho AI và chờ nó suy nghĩ trả lời
            response = model.generate_content(user_message)

            # 5. Đóng gói câu trả lời và gửi về lại cho Frontend
            return JsonResponse({"reply": response.text})

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    
    return JsonResponse({"error": "Chỉ chấp nhận phương thức POST"}, status=400)