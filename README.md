# PromptForge Dev v4

Chrome Extension dành cho developer để viết, tinh chỉnh, lưu và tái sử dụng prompt kỹ thuật.

## Nâng cấp trong v4
- Custom select để tránh lỗi dropdown native và đồng nhất UI hơn
- Workspace presets theo project / repo / stack / review style
- Snippet variables như `{{stack}}`, `{{expected_behavior}}`, `{{target_model}}`
- Resolve variables trực tiếp trong editor
- Diff view giữa prompt gốc và prompt refined
- Giữ nguyên autosave, library, history, export `.md`

## Cách cài
1. Mở `chrome://extensions`
2. Bật **Developer mode**
3. Chọn **Load unpacked**
4. Trỏ tới thư mục `promptforge_dev_ui_v4`

## Workflow tối ưu
1. Tạo hoặc chọn một workspace preset cho project hiện tại
2. Điền expected behavior, actual behavior, context, constraints
3. Generate prompt từ builder
4. Dùng variables nếu bạn muốn giữ prompt dạng template tái sử dụng
5. Refine prompt và kiểm tra Diff View
6. Save prompt tốt vào Library

## Gợi ý cho bản tiếp theo
- Diff side-by-side đẹp hơn
- Variable library theo workspace
- Prompt chains nhiều bước
- Import / export workspace pack
- Keyboard shortcuts đầy đủ
