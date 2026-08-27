/* ============================================
   CONFIGURATION
============================================ */


/*
 * GANTI URL DI BAWAH INI
 * dengan URL Web App Apps Script Anda.
 */

const API_URL =
  "https://script.google.com/macros/s/AKfycbz6mbC7UdVaXYbRGwV_t1hHeVHSJjTnzQIr9Ex8nEcgaEOWEdWNdUAlhpr69GJE5XWe/exec";


/* ============================================
   GLOBAL DATA
============================================ */

let memories = [];

let currentDate =
  new Date();


/* ============================================
   INITIALIZE
============================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadMemories();

  }
);


/* ============================================
   LOAD DATA FROM APPS SCRIPT
============================================ */

async function loadMemories() {

  try {

    const response =
      await fetch(API_URL);

    if (!response.ok) {

      throw new Error(
        "Failed to fetch API"
      );

    }


    memories =
      await response.json();


    console.log(
      "Memories loaded:",
      memories
    );


    /*
     * Render seluruh komponen
     */

    renderCalendar();

    renderImportantDates();

    renderSummary();

    renderFeaturedMoments();


  } catch (error) {

    console.error(
      "Error loading memories:",
      error
    );

    showError();

  }

}


/* ============================================
   CALENDAR
============================================ */

function renderCalendar() {

  const calendarDays =
    document.getElementById(
      "calendarDays"
    );


  calendarDays.innerHTML = "";


  /*
   * Current month & year
   */

  const year =
    currentDate.getFullYear();

  const month =
    currentDate.getMonth();


  /*
   * Update header
   */

  const monthName =
    new Intl.DateTimeFormat(
      "en-US",
      {
        month: "long"
      }
    ).format(currentDate);


  document.getElementById(
    "calendarMonth"
  ).textContent =
    monthName;


  document.getElementById(
    "calendarYear"
  ).textContent =
    year;


  /*
   * First day of month
   */

  const firstDay =
    new Date(
      year,
      month,
      1
    );


  /*
   * JS:
   * Sunday = 0
   *
   * Kita ingin:
   * Monday = 0
   */

  let startDay =
    firstDay.getDay();

  startDay =
    startDay === 0
      ? 6
      : startDay - 1;


  /*
   * Number of days
   */

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  /*
   * Empty cells
   */

  for (
    let i = 0;
    i < startDay;
    i++
  ) {

    const empty =
      document.createElement(
        "div"
      );

    empty.className =
      "calendar-day empty";

    calendarDays.appendChild(
      empty
    );

  }


  /*
   * Generate days
   */

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const cell =
      document.createElement(
        "div"
      );


    cell.className =
      "calendar-day";


    const span =
      document.createElement(
        "span"
      );


    span.textContent =
      day;


    cell.appendChild(
      span
    );


    /*
     * Date ISO
     */

    const dateString =
      formatDateISO(
        year,
        month + 1,
        day
      );


    /* ========================================
       TODAY
    ======================================== */

    /*
     * Ambil tanggal hari ini
     * berdasarkan waktu lokal perangkat.
     */

    const today =
      new Date();


    const todayString =
      formatDateISO(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );


    /*
     * Jika tanggal kalender sama dengan
     * tanggal hari ini, tambahkan class "today".
     *
     * Contoh:
     * 2026-08-27
     *
     * maka:
     *
     * class="calendar-day today"
     */

    if (
      dateString === todayString
    ) {

      cell.classList.add(
        "today"
      );

    }


    /*
     * Check apakah ada memory
     */

    const dayMemories =
      getMemoriesByDate(
        dateString
      );


    if (
      dayMemories.length > 0
    ) {

      cell.classList.add(
        "has-memory"
      );


      cell.addEventListener(
        "click",
        () => {

          selectDate(
            dateString
          );

        }
      );

    }


    /*
     * Selected date
     */

    if (
      selectedDate ===
      dateString
    ) {

      cell.classList.add(
        "selected"
      );

    }


    calendarDays.appendChild(
      cell
    );

  }

}


/* ============================================
   SELECTED DATE
============================================ */

let selectedDate =
  null;


function selectDate(
  date
) {

  selectedDate =
    date;


  renderCalendar();


  const dateMemories =
    getMemoriesByDate(
      date
    );


  const container =
    document.getElementById(
      "selectedMoment"
    );


  if (
    dateMemories.length === 0
  ) {

    container.classList.add(
      "hidden"
    );

    return;

  }


  /*
   * Ambil moment pertama
   */

  const memory =
    dateMemories[0];


  const photo =
    memory.photos &&
    memory.photos.length > 0
      ? memory.photos[0].image_url
      : null;


  container.innerHTML = `

    <div class="selected-date">
      ${escapeHTML(
        memory.date_display
      )}
    </div>

    <div class="selected-location">
      ${escapeHTML(
        memory.location
      )}
    </div>

    <div class="selected-description">
      ${escapeHTML(
        memory.description
      )}
    </div>

    ${
      photo
        ? `
          <img
            class="selected-photo"
            src="${photo}"
            alt="${escapeHTML(
              memory.description
            )}"
            onclick="openPhotoPreview(
                '${photo}',
                '${escapeHTML(memory.description)}'
            )"
          >
        `
        : ""
    }

  `;


  container.classList.remove(
    "hidden"
  );

}


/* ============================================
   IMPORTANT DATES
============================================ */

function renderImportantDates() {

  const container =
    document.getElementById(
      "importantDates"
    );


  /*
   * Hanya category moments
   */

  const important =
    memories
      .filter(
        memory =>
          memory.category ===
          "moments"
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  /*
   * Batasi 8
   */

  const display =
    important.slice(0, 8);


  if (
    display.length === 0
  ) {

    container.innerHTML =
      "<p>No important dates yet.</p>";

    return;

  }


  display.forEach(
    memory => {

      const date =
        new Date(
          memory.date
        );


      const day =
        date.getDate();


      const month =
        new Intl.DateTimeFormat(
          "en-US",
          {
            month: "short"
          }
        ).format(date);


      const item =
        document.createElement(
          "div"
        );


      item.className =
        "important-date";


      item.innerHTML = `

        <div
          class="important-date-number"
        >
          ${day}
          <small>
            ${month}
          </small>
        </div>

        <div
          class="important-date-info"
        >

          <div
            class="important-date-title"
          >
            ${escapeHTML(
              memory.description
            )}
          </div>

          <div
            class="important-date-location"
          >
            ${escapeHTML(
              memory.location
            )}
          </div>

        </div>

        <div
          class="important-date-arrow"
        >
          →
        </div>

      `;


      item.addEventListener(
        "click",
        () => {

          selectDate(
            memory.date
          );


          document
            .getElementById(
              "moments"
            )
            .scrollIntoView({
              behavior: "smooth"
            });

        }
      );


      container.appendChild(
        item
      );

    }
  );

}


/* ============================================
   SUMMARY
============================================ */

function renderSummary() {

  const categories = {

    brandon:
      "brandonCount",

    nurma:
      "nurmaCount",

    moments:
      "momentsCount"

  };


  Object.keys(
    categories
  ).forEach(
    category => {

      const count =
        memories.filter(
          memory =>
            memory.category ===
            category
        ).length;


      document.getElementById(
        categories[category]
      ).textContent =
        count;

    }
  );

}


/* ============================================
   FEATURED MOMENTS
============================================ */

function renderFeaturedMoments() {

  const container =
    document.getElementById(
      "featuredMoments"
    );


  /*
   * Ambil Moments
   */

  const momentMemories =
    memories
      .filter(
        memory =>
          memory.category ===
          "moments"
      )
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      );


  /*
   * 5 terbaru
   */

  const featured =
    momentMemories.slice(
      0,
      5
    );


  if (
    featured.length === 0
  ) {

    container.innerHTML =
      "<p>No moments yet.</p>";

    return;

  }


  featured.forEach(
    memory => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "featured-card";


      const photo =
        memory.photos &&
        memory.photos.length > 0
          ? memory.photos[0].image_url
          : "";


      card.innerHTML = `

        ${
          photo
            ? `
              <img
                class="featured-image"
                src="${photo}"
                alt="${escapeHTML(
                  memory.description
                )}"
                loading="lazy"
                onclick="event.stopPropagation(); openPhotoPreview(
                  '${photo}',
                  '${escapeHTML(memory.description)}'
                )"
              >
            `
            : ""
        }

        <div
          class="featured-info"
        >

          <div
            class="featured-date"
          >
            ${escapeHTML(
              memory.date_display
            )}
          </div>

          <div
            class="featured-title"
          >
            ${escapeHTML(
              memory.description
            )}
          </div>

          <div
            class="featured-location"
          >
            ${escapeHTML(
              memory.location
            )}
          </div>

        </div>

      `;


      card.addEventListener(
        "click",
        () => {

          selectDate(
            memory.date
          );

        }
      );


      container.appendChild(
        card
      );

    }
  );

}


/* ============================================
   MONTH NAVIGATION
============================================ */

document
  .getElementById(
    "previousMonth"
  )
  .addEventListener(
    "click",
    () => {

      currentDate.setMonth(
        currentDate.getMonth() - 1
      );


      selectedDate =
        null;


      renderCalendar();

    }
  );


document
  .getElementById(
    "nextMonth"
  )
  .addEventListener(
    "click",
    () => {

      currentDate.setMonth(
        currentDate.getMonth() + 1
      );


      selectedDate =
        null;


      renderCalendar();

    }
  );


/* ============================================
   HELPERS
============================================ */

function getMemoriesByDate(
  date
) {

  return memories.filter(
    memory =>
      memory.date ===
      date
  );

}


function formatDateISO(
  year,
  month,
  day
) {

  return (

    year +

    "-" +

    String(month)
      .padStart(2, "0") +

    "-" +

    String(day)
      .padStart(2, "0")

  );

}


function escapeHTML(
  text
) {

  if (
    text === undefined ||
    text === null
  ) {

    return "";

  }


  return String(text)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


/* ============================================
   BUTTONS
============================================ */

function scrollToMoments() {

  document
    .getElementById(
      "moments"
    )
    .scrollIntoView({
      behavior: "smooth"
    });

}


function openMoments() {

  window.location.href =
    "moments.html";

}


/* ============================================
   ERROR
============================================ */

function showError() {

  const container =
    document.getElementById(
      "featuredMoments"
    );


  container.innerHTML = `

    <p>
      Unable to load memories.
      Please check the API connection.
    </p>

  `;

}


/* ============================================
   PHOTO LIGHTBOX
============================================ */

function openPhotoPreview(
  imageUrl,
  caption = ""
) {

  const modal =
    document.getElementById(
      "photoLightbox"
    );

  const image =
    document.getElementById(
      "photoLightboxImage"
    );

  const captionElement =
    document.getElementById(
      "photoLightboxCaption"
    );


  if (
    !modal ||
    !image
  ) {

    return;

  }


  image.src =
    imageUrl;


  if (
    captionElement
  ) {

    captionElement.textContent =
      caption || "";

  }


  modal.classList.add(
    "active"
  );


  /*
   * Prevent background page scrolling
   */

  document.body.style.overflow =
    "hidden";

}


function closePhotoPreview() {

  const modal =
    document.getElementById(
      "photoLightbox"
    );

  const image =
    document.getElementById(
      "photoLightboxImage"
    );


  if (
    !modal
  ) {

    return;

  }


  modal.classList.remove(
    "active"
  );


  document.body.style.overflow =
    "";


  /*
   * Clear image after closing
   */

  setTimeout(
    () => {

      if (
        image
      ) {

        image.src =
          "";

      }

    },
    250
  );

}


/*
 * Close dengan tombol ESC
 */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closePhotoPreview();

    }

  }
);