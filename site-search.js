(function () {
  "use strict";

  const form = document.getElementById("mj-site-search-form");
  const input = document.getElementById("mj-site-search-input");
  const panel = document.getElementById("mj-site-search-results");
  if (!form || !input || !panel) return;

  const localPages = [
    { url: "index.html", label: "Home", type: "Page" },
    { url: "index.html#about", label: "About Meetu Jain", type: "Profile" },
    { url: "index.html#featured", label: "The Evidence Room", type: "Section" },
    { url: "index.html#videos", label: "Video Reports & Investigations", type: "Section" },
    { url: "archive.html", label: "Published Work", type: "Archive" },
    { url: "social.html", label: "Digital & Social Media", type: "Social" }
  ];

  let documents = [];
  let ready = false;
  let loadPromise;

  function normalise(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function addDocument(item) {
    if (!item || !item.title) return;
    const body = [item.title, item.description, item.keywords, item.content, item.category]
      .filter(Boolean).join(" ");
    documents.push({
      title: String(item.title),
      description: String(item.description || item.content || "").slice(0, 230),
      keywords: normalise(body),
      url: item.url || "index.html",
      type: item.type || "Page"
    });
  }

  async function loadIndex() {
    if (loadPromise) return loadPromise;
    loadPromise = (async function () {
      documents = [];
      localPages.forEach(addDocument);

      // Include visible headings and copy from all public pages, not just the page being viewed.
      const pageFiles = ["index.html", "archive.html", "social.html"];
      await Promise.all(pageFiles.map(async function (file) {
        try {
          let page;
          if (location.protocol === "file:" && file === location.pathname.split("/").pop()) {
            page = document;
          } else {
            const response = await fetch(file, { credentials: "same-origin" });
            if (!response.ok) return;
            const html = await response.text();
            page = new DOMParser().parseFromString(html, "text/html");
          }
          const main = page.querySelector("main");
          if (!main) return;
          main.querySelectorAll("section, article").forEach(function (section, index) {
            const heading = section.querySelector("h1,h2,h3");
            const title = heading ? heading.textContent.trim() : "";
            const text = section.innerText || section.textContent || "";
            if (!title && !text.trim()) return;
            addDocument({
              title: title || (file.replace(".html", "") + " section " + (index + 1)),
              description: text.replace(/\s+/g, " ").trim().slice(0, 230),
              content: text,
              url: file + (section.id ? "#" + encodeURIComponent(section.id) : ""),
              type: file === "index.html" ? "Meetu Jain" : (file === "archive.html" ? "Published work" : "Digital")
            });
          });
        } catch (error) {
          // Local file previews may block fetch; current-page and article/media indexes still work.
        }
      }));

      // Search all ten article titles, summaries and article text.
      (window.MEETU_FEATURED_STORIES || []).forEach(function (story) {
        addDocument({
          title: story.title,
          description: story.summary || story.article,
          content: story.article,
          keywords: story.category,
          url: "index.html?openStories=1&story=" + encodeURIComponent(story.number),
          type: "Investigation"
        });
      });

      // Published print articles and television reports are indexed by their publication/channel.
      const publicationData = window.MEETU_PUBLICATIONS || {};
      Object.entries(publicationData.print || {}).forEach(function (items) {
        const publication = items[0];
        (items[1] || []).forEach(function (item) {
          addDocument({
            title: item.title,
            description: item.description || item.article || "",
            content: item.article || "",
            keywords: [publication, item.keywords || "", item.date || ""].join(" "),
            url: "archive.html?channel=print&publication=" + encodeURIComponent(publication),
            type: "Print • " + publication
          });
        });
      });
      Object.entries(publicationData.television || {}).forEach(function (items) {
        const channel = items[0];
        (items[1] || []).forEach(function (item) {
          addDocument({
            title: item.title,
            description: item.description || "",
            keywords: [channel, item.keywords || "", item.date || ""].join(" "),
            url: "archive.html?channel=television&publication=" + encodeURIComponent(channel),
            type: "Television • " + channel
          });
        });
      });

      // Uploaded media is indexed through its manifest: title, description and keywords.
      try {
        const response = await fetch("media-manifest.json", { credentials: "same-origin" });
        if (response.ok) {
          const manifest = await response.json();
          ["images", "pdfs", "videos"].forEach(function (kind) {
            (manifest[kind] || []).forEach(function (media) {
              if (!media.url || !/^https:\/\//i.test(media.url)) return;
              addDocument({
                title: media.title || media.filename,
                description: media.description || "",
                keywords: media.keywords || "",
                url: media.url,
                type: kind.slice(0, -1).toUpperCase()
              });
            });
          });
        }
      } catch (error) {
        // Media manifest search is available when served from a web server.
      }
      ready = true;
    })();
    return loadPromise;
  }

  function showResults(query) {
    const term = normalise(query);
    panel.replaceChildren();
    if (!term) {
      panel.hidden = true;
      return;
    }
    const words = term.split(" ").filter(Boolean);
    const matches = documents
      .map(function (doc) {
        const title = normalise(doc.title);
        const haystack = doc.keywords;
        let score = 0;
        words.forEach(function (word) {
          if (title.includes(word)) score += 5;
          if (haystack.includes(word)) score += 2;
        });
        return { doc: doc, score: score };
      })
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 12);

    if (!matches.length) {
      const empty = document.createElement("p");
      empty.className = "mj-search-empty";
      empty.textContent = ready
        ? "No matching stories or media found. Try another keyword."
        : "Preparing the website search index…";
      panel.appendChild(empty);
    } else {
      matches.forEach(function (match) {
        const link = document.createElement("a");
        link.className = "mj-search-result";
        link.href = match.doc.url;
        const meta = document.createElement("small");
        meta.textContent = match.doc.type;
        const title = document.createElement("strong");
        title.textContent = match.doc.title;
        const description = document.createElement("span");
        description.textContent = match.doc.description;
        link.append(meta, title, description);
        panel.appendChild(link);
      });
    }
    panel.hidden = false;
  }

  input.addEventListener("input", function () {
    if (!ready) loadIndex().then(function () { showResults(input.value); });
    else showResults(input.value);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!ready) {
      loadIndex().then(function () { showResults(input.value); });
    } else {
      showResults(input.value);
    }
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".mj-site-search")) panel.hidden = true;
  });
  input.addEventListener("focus", function () {
    if (input.value.trim()) showResults(input.value);
  });
  input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      panel.hidden = true;
      input.blur();
    }
  });

  loadIndex();
})();