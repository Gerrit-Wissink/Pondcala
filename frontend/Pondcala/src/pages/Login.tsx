import { useState } from "react";

export default function Login() {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [errorMessage, setErrorMessage] = useState("");
    const [creating, setCreating] = useState(false);

    function handleLogin() {
        setErrorMessage("");
        event?.preventDefault();
        if (username.length < 1) {
            setErrorMessage("Username is required");
            return;
        }
        if (password.length < 1) {
            setErrorMessage("Password is required");
            return;
        }

        
    }

    const inputStyle = {
        padding: "10px"
    }

    return (
        <div>
            <div style={{ backgroundColor: 'black', padding: '15px', borderRadius: '15px', color: 'white', minWidth: "300px", minHeight: "200px"}}>
                <h2>{creating ? "Create Account" : "Login"}</h2>
                <form onSubmit={handleLogin} style={{display: "flex", flexDirection: "column", gap: "15px"}}>
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