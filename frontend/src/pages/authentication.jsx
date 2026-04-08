import * as React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import goldTheme from '../themes/goldTheme';
import useASCIICanvas from '../hooks/useASCIICanvas';

export default function Authentication() {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);
    const canvasRef = useASCIICanvas();
    const router = useNavigate();

    let handleAuth = async () => {
        try {
            if (formState === 0) {
                await handleLogin(username, password);
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                setUsername('');
                setMessage(result);
                setOpen(true);
                setError('');
                setFormState(0);
                setPassword('');
            }
        } catch (err) {
            console.log(err);
            let message = err.response.data.message;
            setError(message);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleAuth();
    };

    return (
        <ThemeProvider theme={goldTheme}>
            <div className="authPage">
                <canvas ref={canvasRef} className="pageCanvas" />
                <div className="pageOverlay" />

                <div className="pageContent authContent">
                    {/* Top bar */}
                    <header className="landingTopBar">
                        <nav className="authTopLeft">
                            <span className="navLinkBracket" onClick={() => router("/")}>
                                [HOME]
                            </span>
                            <span className="bracketLabel">[V_C_26]</span>
                        </nav>
                        <span className="landingBrand">VideoCircle®</span>
                        <span className="bracketLabel">[AUTH]</span>
                    </header>

                    {/* Card */}
                    <div className="authCard">
                        <div className="authCardHeader">
                            <p className="authScript">
                                {formState === 0 ? 'welcome back,' : 'join the circle,'}
                            </p>
                            <h2 className="authCardTitle">
                                {formState === 0 ? 'SIGN IN' : 'REGISTER'}
                            </h2>
                        </div>

                        <div className="authFormPanel">
                            <div className="authTabs">
                                <button
                                    className={`authTab${formState === 0 ? ' active' : ''}`}
                                    onClick={() => setFormState(0)}
                                >
                                    [SIGN IN]
                                </button>
                                <button
                                    className={`authTab${formState === 1 ? ' active' : ''}`}
                                    onClick={() => setFormState(1)}
                                >
                                    [REGISTER]
                                </button>
                            </div>

                            <Box component="form" noValidate sx={{ width: '100%' }} onKeyDown={handleKeyDown}>
                                {formState === 1 && (
                                    <TextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="Full Name"
                                        value={name}
                                        autoFocus
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                )}
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Username"
                                    value={username}
                                    autoFocus={formState === 0}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                                <TextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Password"
                                    value={password}
                                    type="password"
                                    onChange={(e) => setPassword(e.target.value)}
                                />

                                {error && <p className="authError">{error}</p>}

                                <button
                                    type="button"
                                    className="authSubmitBtn"
                                    onClick={handleAuth}
                                >
                                    {formState === 0 ? '[SIGN IN →]' : '[CREATE ACCOUNT →]'}
                                </button>
                            </Box>
                        </div>
                    </div>
                </div>
            </div>

            <Snackbar open={open} autoHideDuration={4000} message={message} onClose={() => setOpen(false)} />
        </ThemeProvider>
    );
}
