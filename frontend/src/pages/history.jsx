import React, { useContext, useEffect, useRef, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import "../App.css";

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();
    const canvasRef = useRef(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await getHistoryOfUser();
                setMeetings(history);
            } catch {
                // IMPLEMENT SNACKBAR
            }
        }
        fetchHistory();
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const CHARS = 'VIDEOCIRCL·=+-*·N·U·S·E·I·2·0·1·6·····=·+·-·*·V·I·D·E·O·C·';
        const FONT_SIZE = 13;
        const CHAR_W = FONT_SIZE * 0.62;

        let cols, rows, grid;

        const initGrid = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            cols = Math.ceil(canvas.width / CHAR_W);
            rows = Math.ceil(canvas.height / FONT_SIZE);
            grid = Array.from({ length: rows * cols }, () =>
                CHARS[Math.floor(Math.random() * CHARS.length)]
            );
        };

        initGrid();

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = `${FONT_SIZE}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = 'rgba(185, 138, 18, 0.42)';

            const updateCount = Math.max(1, Math.floor(grid.length * 0.008));
            for (let i = 0; i < updateCount; i++) {
                grid[Math.floor(Math.random() * grid.length)] = CHARS[Math.floor(Math.random() * CHARS.length)];
            }

            for (let i = 0; i < grid.length; i++) {
                ctx.fillText(grid[i], (i % cols) * CHAR_W, (Math.floor(i / cols) + 1) * FONT_SIZE);
            }
        };

        const interval = setInterval(draw, 80);
        draw();

        const handleResize = () => { initGrid(); draw(); };
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    return (
        <div className="historyPage">
            <canvas ref={canvasRef} className="historyCanvas" />
            <div className="historyOverlay" />

            <div className="historyContent">
                <header className="landingTopBar">
                    <nav className="authTopLeft">
                        <span className="navLinkBracket" onClick={() => routeTo("/home")}>[HOME]</span>
                        <span className="bracketLabel">[V_C_26]</span>
                    </nav>
                    <span className="landingBrand">VideoCircle®</span>
                    <span className="bracketLabel">[HISTORY]</span>
                </header>

                <main className="historyMain">
                    <div className="historyHeading">
                        <p className="authScript">your sessions,</p>
                        <h1 className="historyTitle">MEETING<br />HISTORY</h1>
                    </div>

                    <div className="historyList">
                        {meetings.length !== 0 ? meetings.map((e, i) => (
                            <div key={i} className="historyCardItem">
                                <span className="historyCardCode">{e.meetingCode}</span>
                                <span className="historyCardDate">{formatDate(e.date)}</span>
                            </div>
                        )) : (
                            <div className="historyEmpty">
                                <span className="historyEmptySymbol">[∅]</span>
                                <h3>No meetings yet</h3>
                                <p>Your meeting history will appear here</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
