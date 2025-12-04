
export default function GameInvitationModal({sender}: {sender: string}) {

    function acceptInvitation() {
        // Logic to accept the invitation
    }

    function declineInvitation() {
        // Logic to decline the invitation
    }


    return (
        <div style = {
            {position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'}
        }>
            <h2>Game Invitation</h2>
            <p>{sender} has invited you to a game!</p>
            <button>Accept</button>
            <button>Decline</button>
        </div>
    );
}