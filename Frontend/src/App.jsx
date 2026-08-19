import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "./routes/routes.jsx";
import useAuthStore from "./store/authStore";

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Router />
    </BrowserRouter>
  );
}

export default App;