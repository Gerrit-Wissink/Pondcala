import { getUsername } from "../utils/UserCache";
import { sendMessage } from "../utils/WebSockets";

export default function GameInvitationModal({invite, setInvitations}: {invite: any, setInvitations: React.Dispatch<React.SetStateAction<any[]>>}) {

    function acceptInvitation() {
        const acceptMessage = {
            ...invite,
            type: "invite",
            status: "accepted"
        };
        sendMessage(acceptMessage);
        
        // Remove this invitation from the list
        setInvitations((prevInvitations) => 
            prevInvitations.filter((inv) => inv.sender !== invite.sender)
        );
    }

    function declineInvitation() {
        const declineMessage = {
            ...invite,
            type: "invite",
            status: "declined"
        };
        sendMessage(declineMessage);
        
        // Remove this invitation from the list
        setInvitations((prevInvitations) => 
            prevInvitations.filter((inv) => inv.sender !== invite.sender)
        );
    }


    return (
        <div style = {
            {position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'}
        }>
            <h2>Game Invitation</h2>
            <p>{getUsername(typeof invite.sender === "number" ? invite.sender : parseInt(invite.sender))} has invited you to a game!</p>
            <div style={{display: 'flex', justifyContent: 'space-around', marginTop: '20px'}}>
                <button style={{backgroundColor: 'green', color: 'white'}} onClick={acceptInvitation}>Accept</button>
                <button style={{backgroundColor: 'red', color: 'white'}} onClick={declineInvitation}>Decline</button>
            </div>
        </div>
    );
}