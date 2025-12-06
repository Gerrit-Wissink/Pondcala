import "./lobbyChat.css"

export default function Chat({type}: {type?: string}) {
    const primaryColor = '#ff9800';
    const borderColor = '#444';
    const backgroundColor = '#fff';
    const borderRadius = '0.5em';
    const boxShadow = '0 0.25em 0.5em rgba(0, 0, 0, 0.1)';

    const chatSidebarStyle: React.CSSProperties = {
        // position: 'fixed',
        // top: 0,
        // right: 0,
        // width: '20%',
        // height: '100vh',
        // backgroundColor: type === "lobby" ? '#ffffff' : '#000000',
        // borderRadius: borderRadius,
        // padding: '1em',
        // boxShadow: boxShadow,
        // display: 'flex',
        // flexDirection: 'column',
        // maxHeight: 'calc(100vh - 5em)',
        // zIndex: 1000,
        // overflow: 'hidden',
        // borderLeft: '2px solid black',
    };

    const chatHeaderStyle: React.CSSProperties = {
        // marginTop: 0,
        // marginBottom: '1em',
        // color: '#222',
        // fontSize: '1.2rem',
        // borderBottom: `0.2em solid ${primaryColor}`,
        // paddingBottom: '0.5em',
    };

    const chatContentStyle: React.CSSProperties = {
        // flex: 1,
        // overflowY: 'auto',
        // marginBottom: '1em',
        // padding: '0.5em',
        // display: 'flex',
        // flexDirection: 'column',
        // gap: '0.5em',
        // color: type === "lobby" ? '#222' : '#fff',
    };

    const chatInputAreaStyle: React.CSSProperties = {
        // display: 'flex',
        // gap: '0.5em',
        // alignItems: 'flex-end',
        // height: '3em',
    };

    const textareaStyle: React.CSSProperties = {
        // flex: 1,
        // padding: '0.5em',
        // border: `1px solid ${borderColor}`,
        // borderRadius: borderRadius,
        // fontFamily: 'inherit',
        // resize: 'vertical' as const,
        // height: 'calc(100% - 1em - 2px)',
    };

    const buttonStyle: React.CSSProperties = {
        // marginTop: 0,
        // padding: '0.5em 1em',
        // flexShrink: 0,
        // height: '100%',
        // fontSize: '14px',
        // border: `1px solid ${borderColor}`,
        // background: backgroundColor,
        // borderRadius: borderRadius,
        // cursor: 'pointer',
        // transition: 'background 0.15s ease, color 0.15s ease',
    };

    return (
        <>
            <aside style={chatSidebarStyle}>
                <h2 style={chatHeaderStyle}>Lobby Chat</h2>
                <div id={`${type}-chat-content`} style={chatContentStyle}>
                    {/* <!-- Chat messages will appear here --> */}
                </div>
                <div style={chatInputAreaStyle}>
                    <textarea 
                        id={`${type}-chat-message`} 
                        placeholder="Type a message..."
                        style={textareaStyle}
                        onFocus={(e) => {
                            e.currentTarget.style.outline = `2px solid ${primaryColor}`;
                            e.currentTarget.style.outlineOffset = '0';
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.outline = '';
                            e.currentTarget.style.outlineOffset = '';
                        }}
                    />
                    <button 
                        id={`${type}-send-btn`} 
                        title="Send message"
                        style={buttonStyle}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = borderColor;
                            e.currentTarget.style.color = backgroundColor;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = backgroundColor;
                            e.currentTarget.style.color = '';
                        }}
                    >
                        ⌯⌲
                    </button>
                </div>
            </aside>
        </>
    );
}