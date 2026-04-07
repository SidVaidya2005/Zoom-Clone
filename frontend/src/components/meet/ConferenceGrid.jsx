import React from 'react';
import styles from '../../styles/videoComponent.module.css';

function getGridDimensions(count) {
    if (count <= 1) return { cols: 1, rows: 1 };
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    return { cols, rows };
}

export default function ConferenceGrid({ videos }) {
    const { cols, rows } = getGridDimensions(videos.length);

    return (
        <div
            className={styles.conferenceView}
            style={{
                '--grid-cols': cols,
                '--grid-rows': rows,
            }}
        >
            {videos.map((video) => (
                <div key={video.socketId} className={styles.conferenceCell}>
                    <video
                        data-socket={video.socketId}
                        ref={ref => {
                            if (ref && video.stream) ref.srcObject = video.stream;
                        }}
                        autoPlay
                    />
                </div>
            ))}
        </div>
    );
}
