import { useState } from "react";
import "../css/PlayGame.css";

export function WriteNextStoryPiece({ sendPiece }: { sendPiece: (piece: string) => Promise<boolean>; }) {
    const [text, setText] = useState("");

    const sendPieceWrapper = async (text: string) => {
        const result = await Promise.resolve(sendPiece(text))
        if (result) {
            setText("")
        }
    }

    return (
        <div className="write-next-piece">
            <textarea
                className="story-textarea"
                placeholder="Write the next part..."
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <button onClick={() => sendPieceWrapper(text)} className="btn send-btn">
                Send
            </button>
        </div>
    );
}
