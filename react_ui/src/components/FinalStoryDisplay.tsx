import "../css/PlayGame.css";

export function FinalStoryDisplay({title, storyPieces}: {title: string; storyPieces: [string, string][]}) {
  return (
      <div className="final-story-display">
          <h2 className="final-story-title">Final Story</h2>
          <h3 className="final-story-subtitle">Title: {title}</h3>
          {storyPieces.map((piece, idx) => (
              <div key={idx} className="story-piece">
                  <p><strong>{idx + 1}.</strong> {piece[0]}</p>
                  <p className="story-author">Written by: {piece[1]}</p>
              </div>
          ))}
          <p className="final-story-end">Thanks for playing!</p>
      </div>
  )
}
