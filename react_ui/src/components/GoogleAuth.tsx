import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

interface GoogleAuthProps {
    loginSuccessCallback: (user: any) => void | Promise<void>;
    loginErrorCallback: () => void | Promise<void>;
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({loginSuccessCallback, loginErrorCallback,}) => {
    
    const loginSuccess = async (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            const decoded: any = jwtDecode(credentialResponse.credential);
            await Promise.resolve(loginSuccessCallback(decoded));
        } 
    }

    return (
        <GoogleLogin 
            onSuccess={(credentialResponse) => loginSuccess(credentialResponse)} 
            onError={loginErrorCallback} 
        />
    )
}