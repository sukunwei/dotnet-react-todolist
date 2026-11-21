namespace TodoList.Application.Common;

/// <summary>
/// Application 層所有可預期錯誤的基底型別。API 層的中介層依此判斷要回傳哪一種 HTTP 狀態碼。
/// </summary>
public abstract class AppException(string message) : Exception(message);

/// <summary>
/// 找不到指定資源（例如 Id 不存在）。API 層對應 HTTP 404。
/// </summary>
public sealed class NotFoundException(string message) : AppException(message);

/// <summary>
/// 使用者輸入未通過驗證。API 層對應 HTTP 400。
/// </summary>
public sealed class ValidationException(string message) : AppException(message);
