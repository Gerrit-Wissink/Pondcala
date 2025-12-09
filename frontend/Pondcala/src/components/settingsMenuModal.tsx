import { useState } from "react";
import { deleteCookie } from "../utils/apiClient";
import UserStatsModal from "./userStatsModal";

export default function SettingsMenuModal({open, setOpen, playing, handleForfeit}: {open: boolean, setOpen: (open: boolean) => void, playing: boolean, handleForfeit: () => void | null}) {

    const [statsOpen, setStatsOpen] = useState(false);

    function closeModal() {
        // Logic to close the modal
        setOpen(false);
    }

    function Logout() {
        console.log("Logging out...");
        // Add logout logic here
        deleteCookie("session_token");
        localStorage.removeItem("token");
        //Need to remove session cookie and redirect to login page
        window.location.href = "/#/login";
    }

    return (
        <div style = {
            {position: 'fixed', display: open ? 'flex': 'none', flexDirection: 'column', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'}
        }>
            {/* This button should be in the top right of the modal */}
            
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2>Settings</h2>
                <button onClick={closeModal} style={{alignSelf: 'flex-end'}}>Close</button>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                {/* Logout Button */}
                <button onClick={() => {
                    console.log("Logging out...");
                    // Add logout logic here
                    Logout();
                }}>
                    Logout
                </button>
                {/* User Stats Button */}
                <button onClick={() => setStatsOpen(true)}>
                    User Stats
                </button>
                {/* Forfeit Button if on game screen*/}
                {playing && handleForfeit  !== null && <button onClick={() => {
                    console.log("Forfeiting game...");
                    // Add forfeit logic here
                }}>
                    Forfeit Game
                </button>}
                {/* Back to Menu Button if on game screen */}
                {playing && <button onClick={() => {
                    console.log("Returning to main menu...");
                    // Add return to menu logic here
                    window.location.href = "/#/lobby";
                }}>
                    Back to Main Menu
                </button>}
            </div>
            {statsOpen && <UserStatsModal open={statsOpen} setOpen={setStatsOpen} />}
        </div>
    );
}