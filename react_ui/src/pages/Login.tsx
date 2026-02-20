import { useUserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUserFromLocalStorage, setUserInLocalStorage } from "../util/LocalStorage";
import { GoogleAuth } from "../components/GoogleAuth";
import { GameService } from "../util/LocalServerService";
import "../css/Login.css"; // 👈 add this

export function Login() {
  const { user, setUser } = useUserContext();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      const local_user = getUserFromLocalStorage();
      if (!local_user) return;
      setUser(local_user);
      navigate("/home");
    }
  }, []);

  const getPlayerID = async (name: string, email: string): Promise<string | null> => {
    const res = await GameService.getPlayerId(name, email);
    if (res.error) {
      setError(`SOMETHING WENT WRONG: ${res.error.message}`);
    } else if (res.data) {
      setError(null);
      return res.data.player_id;
    }
    return null;
  };

  const loginSuccess = async (google_user: any) => {
    const id = await getPlayerID(google_user.name, google_user.email);
    if (!id) return;
    const new_user = {
      id: id,
      name: google_user.name,
      email: google_user.email,
    };
    setUser(new_user);
    setUserInLocalStorage(new_user);
    navigate("/home");
  };

  const loginError = () => {
    console.log("Something went wrong, could not authenticate with google.");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Login</h1>
        <p>Sign in with Google to start playing</p>
        <GoogleAuth
          loginSuccessCallback={loginSuccess}
          loginErrorCallback={loginError}
        />
        {error && <p className="error-text">{error}</p>}
      </div>
    </div>
  );
}
