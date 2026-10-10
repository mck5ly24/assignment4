
/*
  Name: Ronald Hester Jr.
  Date: 10.09.2026
  CSC 372-01

  This JavaScript file uses the TVmaze Fetch API to
  search for TV shows and retrieve cast information.
  It creates show cards and displays them in a
  responsive gallery.
*/

let searchForm = document.querySelector("#search-form");
let searchInput = document.querySelector("#search-input");
let gallery = document.querySelector("#show-gallery");
let message = document.querySelector("#message");
let searchNumber = 0;

/**
 * Converts HTML summaries into plain text.
 * @param {string} summary - The show's HTML summary.
 * @return {string} The summary without HTML tags.
 */
function cleanSummary(summary) {
    if (!summary) {
        return "Not available";
    }

    let parser = new DOMParser();
    let documentData = parser.parseFromString(summary, "text/html");

    return documentData.body.textContent.trim() || "Not available";
}

/**
 * Adds a paragraph containing show information.
 * @param {HTMLElement} card - The show card.
 * @param {string} label - The information label.
 * @param {string} value - The information value.
 */
function addDetail(card, label, value) {
    let paragraph = document.createElement("p");
    paragraph.textContent = label + ": " + value;
    card.appendChild(paragraph);
}

/**
 * Retrieves the main cast for a TV show.
 * @param {number} showId - The show's TVmaze ID.
 * @return {Promise<string>} The cast members' names.
 */
async function getCast(showId) {
    let url = "https://api.tvmaze.com/shows/" + showId + "/cast";
    let response = await fetch(url);

    if (response.status === 429) {
        throw new Error("Rate limit reached. Please try again later.");
    }

    if (!response.ok) {
        throw new Error("Could not load cast information.");
    }

    let cast = await response.json();

    if (cast.length === 0) {
        return "Not available";
    }

    let names = cast.slice(0, 5).map(function (member) {
        return member.person.name;
    });

    return names.join(", ");
}

/**
 * Creates and displays a card for one TV show.
 * @param {Object} show - The TVmaze show information.
 * @param {number} currentSearch - The current search number.
 */
async function displayShow(show, currentSearch) {
    let card = document.createElement("article");
    card.className = "show-card";

    // Show name
    let heading = document.createElement("h2");
    heading.textContent = show.name || "Unknown Show";
    card.appendChild(heading);

    // Show poster
    if (show.image && show.image.medium) {
        let poster = document.createElement("img");
        poster.src = show.image.medium;
        poster.alt = "Poster for " + (show.name || "TV show");
        card.appendChild(poster);
    }

    // Show summary
    addDetail(card, "Summary", cleanSummary(show.summary));

    // Premiere date
    addDetail(card, "Premiered", show.premiered || "Not available");

    // Last updated date and time
    let updated = "Not available";

    if (show.updated != null) {
        let date = new Date(show.updated * 1000);

        if (!isNaN(date.getTime())) {
            updated = date.toLocaleString();
        }
    }

    addDetail(card, "Last Updated", updated);

    // Genres
    let genres = "Not available";

    if (show.genres && show.genres.length > 0) {
        genres = show.genres.join(", ");
    }

    addDetail(card, "Genres", genres);

    // Average rating
    let rating = "Not available";

    if (show.rating && show.rating.average != null) {
        rating = String(show.rating.average);
    }

    addDetail(card, "Average Rating", rating);

    // Main cast
    let castParagraph = document.createElement("p");
    castParagraph.textContent = "Main Cast: Loading...";
    card.appendChild(castParagraph);

    // TVmaze show link
    let link = document.createElement("a");
    link.href = show.url || "https://www.tvmaze.com/";
    link.textContent = "View on TVmaze";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    card.appendChild(link);

    // Prevent old searches from adding cards
    if (currentSearch !== searchNumber) {
        return;
    }

    gallery.appendChild(card);

    // Second fetch request for cast information
    try {
        let cast = await getCast(show.id);

        if (currentSearch === searchNumber) {
            castParagraph.textContent = "Main Cast: " + cast;
        }
    } catch (error) {
        if (currentSearch === searchNumber) {
            if (error.message.includes("Rate limit")) {
                castParagraph.textContent =
                    "Main Cast: Rate limit reached. Try again later.";
            } else {
                castParagraph.textContent = "Main Cast: Not available";
            }
        }
    }
}

/**
 * Searches TVmaze and displays up to ten matching shows.
 * @param {string} query - The visitor's search text.
 */
async function searchShows(query) {
    searchNumber++;
    let currentSearch = searchNumber;

    // Clear previous results
    gallery.innerHTML = "";
    message.textContent = "";

    // Handle empty searches
    if (query.trim() === "") {
        message.textContent = "Please enter a TV show name.";
        return;
    }

    message.textContent = "Searching for TV shows...";

    try {
        // Encode the search text for the URL
        let url = "https://api.tvmaze.com/search/shows?q=" +
            encodeURIComponent(query.trim());

        // First fetch request
        let response = await fetch(url);

        if (response.status === 429) {
            throw new Error(
                "Too many requests. Please try again later."
            );
        }

        if (!response.ok) {
            throw new Error("Unable to retrieve TV shows.");
        }

        // Convert JSON response into JavaScript data
        let results = await response.json();

        // Ignore results from an older search
        if (currentSearch !== searchNumber) {
            return;
        }

        message.textContent = "";

        // Handle searches with no matching shows
        if (results.length === 0) {
            message.textContent = "No matching TV shows found.";
            return;
        }

        // Display a maximum of ten shows
        let shows = results.slice(0, 10);

        for (let result of shows) {
            displayShow(result.show, currentSearch);
        }
    } catch (error) {
        if (currentSearch === searchNumber) {
            gallery.innerHTML = "";
            message.textContent = error.message;
        }
    }
}

/**
 * Handles the search form submission.
 * @param {Event} event - The form submission event.
 */
searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    searchShows(searchInput.value);
});

// Automatically search for Power when the page loads
searchInput.value = "Power";
searchShows("Power");
