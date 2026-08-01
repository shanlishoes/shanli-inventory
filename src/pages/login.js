import { login } from "../services/api";

export function initLogin(onSuccess) {

    document.getElementById("loginBtn").onclick = async () => {

        const name =
            document.getElementById("loginName").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        if (!name || !password) {

            alert("نام و رمز عبور را وارد کنید");
            return;

        }

        const result = await login(name, password);

        if (!result.success) {

            alert(result.message);
            return;

        }

        localStorage.setItem(
            "currentUser",
            JSON.stringify(result)
        );

        onSuccess(result);

    };

}