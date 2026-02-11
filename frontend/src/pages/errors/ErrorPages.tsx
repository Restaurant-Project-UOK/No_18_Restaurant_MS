import { useNavigate } from "react-router-dom";
import "./ErrorPages.css";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">404</h1>
        <h2 className="error-title">Page Not Found</h2>
        <p className="error-message">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <button className="error-button" onClick={() => navigate("/menu")}>
          Go to Menu
        </button>
      </div>
    </div>
  );
}

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">403</h1>
        <h2 className="error-title">Access Denied</h2>
        <p className="error-message">
          You don't have permission to access this page. Your user role doesn't
          allow this action.
        </p>
        <button className="error-button" onClick={() => navigate("/menu")}>
          Go Back to Menu
        </button>
      </div>
    </div>
  );
}

export function ServerError() {
  const navigate = useNavigate();

  return (
    <div className="error-page">
      <div className="error-content">
        <h1 className="error-code">500</h1>
        <h2 className="error-title">Server Error</h2>
        <p className="error-message">
          Something went wrong on the server. Please try again later.
        </p>
        <button className="error-button" onClick={() => navigate("/menu")}>
          Go Home
        </button>
      </div>
    </div>
  );
}
