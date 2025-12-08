export default function LoadingModal({isLoading}: {isLoading: boolean}) {
    if (!isLoading) return null;
    return (
        <div style = {
            {position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 0 10px rgba(0,0,0,0.5)'}
        }>
            <h2>Loading...</h2>
        </div>
    );
}