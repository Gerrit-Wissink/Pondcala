import { useState } from "react";
import apiClient from "../utils/apiClient";

export default function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("");
    const [creating, setCreating] = useState(false);

    async function handleLogin() {
        setErrorMessage("");
        event?.preventDefault();
        try{
            if (username.trim().length < 1) {
                throw new Error("Username is required")
            }
            if (password.trim().length < 1) {
                throw new Error("Password is required");
            }

            let requestBody = {
                username,
                password
            }

            let response = await apiClient.post("/login", requestBody);

            if(response.status !== 200 || response.data.Error) {
                throw new Error(`${response.statusText}`)
            }

            let user = response.data.User;
            console.log("User returned from login", user);
            localStorage.setItem("user", JSON.stringify(user));

            if (!user) {
                throw new Error("Invalid login credentials");
            }else {
                // Redirect to lobby or main page
                window.location.href = "/#/lobby";
            }

        }catch (error) {
            console.log(`Error logging in: ${error}`)
            setErrorMessage(`${error}`)
        }
    }

    async function handleCreateAccount() {
        setErrorMessage("");
        event?.preventDefault();
        try{
            if (username.trim().length < 1) {
                throw new Error("Username is required")
            }
            if (password.trim().length < 1) {
                throw new Error("Password is required");
            }

            let requestBody = {
                username,
                password
            }

            let response = await apiClient.post("/createAccount", requestBody);

            if(response.status !== 200 || response.data.Error) {
                throw new Error(`${response.statusText}`)
            }

            let user = response.data.User;
            console.log("User returned from account creation", user);
            localStorage.setItem("user", JSON.stringify(user));

            if (!user) {
                throw new Error("Invalid login credentials");
            }else {
                // Redirect to lobby or main page
                window.location.href = "/#/lobby";
            }
        }catch (error) {
            console.log(`Error creating account: ${error}`)
            setErrorMessage(`${error}`)
        }
    }

    const inputStyle = {
        padding: "10px"
    }

    return (
        <div>
            <div style={{ backgroundColor: 'black', padding: '15px', borderRadius: '15px', color: 'white', minWidth: "300px", minHeight: "200px"}}>
                <h2>{creating ? "Create Account" : "Login"}</h2>
                <form onSubmit={creating ? handleCreateAccount : handleLogin} style={{display: "flex", flexDirection: "column", gap: "15px"}}>
                    <input id="username" name="username" placeholder="Username" value={username} style={inputStyle} onChange={event => setUsername(event.target.value)}/>
                    <input id="password" name="password" type="password" placeholder="Password"value={password} style={inputStyle} onChange={event => setPassword(event.target.value)}/>
                    <div>
                        <p style={{color: "white", fontSize: "1em", cursor: "pointer", textAlign: "left", padding: 0}} onClick={() => {setCreating(!creating)}} >{creating ? "Back to Login" : "Create An Account"}</p>
                        <p style={{color: "red"}}>{errorMessage}</p>
                        <button type="submit" style={{backgroundColor: 'black', color: 'white', minWidth: "100%", fontSize: "1em"}}>{creating ? "Create Account" : "Login"}</button>
                    </div>
                </form>
            </div>  
        </div>
    );
}