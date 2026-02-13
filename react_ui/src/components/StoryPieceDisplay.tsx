import "../css/PlayGame.css";

export function StoryPieceDisplay({ storyPiece, gameLength, storyLength, storyTitle }: any) {
    const final = storyLength === gameLength - 1;
    return (
        <div className="story-piece-display">
            {final && <p className="final-piece-text">Final Piece! Wrap it up!</p>}
            <p>{`${storyLength + 1}/${gameLength}: ${storyPiece}`}</p>
            <p>Title: {storyTitle}</p>
        </div>
    );
}