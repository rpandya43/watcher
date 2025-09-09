export function EpisodeReminderEmail({ shows, userName }: { shows: any[]; userName: string }) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <div
        style={{
          backgroundColor: "#6366f1",
          color: "white",
          padding: "20px",
          textAlign: "center",
          borderRadius: "5px 5px 0 0",
        }}
      >
        <h1 style={{ margin: "0" }}>🎬 Your Shows Are Airing Tomorrow! 🎬</h1>
      </div>

      <div style={{ backgroundColor: "#f9fafb", padding: "20px", borderRadius: "0 0 5px 5px" }}>
        <p>Hey {userName || "there"},</p>

        <p>
          Get ready for some great entertainment! The following shows you're tracking have new episodes airing tomorrow:
        </p>

        {shows.map((show, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "10px",
              backgroundColor: "white",
              borderRadius: "5px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "5px" }}>{show.show_name}</div>
            <p>Don't miss the new episode airing on {new Date(show.next_episode_date).toLocaleDateString()}!</p>
            <a
              href={`https://watchtracker.com/dashboard/tv-shows/${show.tmdb_id}`}
              style={{
                display: "inline-block",
                backgroundColor: "#6366f1",
                color: "white",
                padding: "10px 20px",
                textDecoration: "none",
                borderRadius: "5px",
              }}
            >
              View Show Details
            </a>
          </div>
        ))}

        <p>Happy watching!</p>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "#666" }}>
          <p>You're receiving this email because you've opted in for episode reminders on WatchTracker.</p>
          <p>
            To update your notification preferences,{" "}
            <a href="https://watchtracker.com/dashboard/settings">visit your settings</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
