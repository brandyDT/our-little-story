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

let currentDate = new Date();

let selectedDate = null;


/*
 * Recent Moments Preview
 */

let recentPreviewPhotos = [];

let recentPreviewIndex = 0;

let recentPreviewInterval = null;

let recentPreviewVisibleCount = 3;

let recentPreviewIsAnimating = false;


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

    renderRecentMomentsPreview();


  } catch (error) {

    console.error(
      "Error loading memories:",
      error
    );

    showError();

  }

}


/* ============================================
   RECENT MOMENTS PHOTO PREVIEW
============================================ */

/*
 * Infinite carousel.
 *
 * Konsep:
 *
 * ORIGINAL:
 *
 * 1 2 3 4 5
 *
 *
 * TRACK:
 *
 * 1 2 3 4 5 1 2 3 4 5 ...
 *
 *
 * Yang terlihat:
 *
 * 1 2 3
 *
 * kemudian:
 *
 * 2 3 4
 *
 * kemudian:
 *
 * 3 4 5
 *
 * kemudian:
 *
 * 4 5 1
 *
 * kemudian:
 *
 * 5 1 2
 *
 * kemudian:
 *
 * 1 2 3
 *
 *
 * Tidak ada reset visual.
 */

function renderRecentMomentsPreview() {

  const container =
    document.getElementById(
      "recentMomentsPreview"
    );


  /*
   * Jika element belum ada,
   * hentikan fungsi.
   */

  if (!container) {

    return;

  }


  /*
   * Stop animation sebelumnya.
   */

  stopRecentMomentsAnimation();


  /*
   * Reset state.
   */

  recentPreviewPhotos = [];

  recentPreviewIndex = 0;

  recentPreviewIsAnimating = false;


  /*
   * Ambil seluruh moment.
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
   * Ambil beberapa moment terbaru.
   *
   * Sampai 5 moment terbaru.
   */

  const latestMoments =
    momentMemories.slice(
      0,
      5
    );


  /*
   * Masukkan seluruh foto.
   */

  latestMoments.forEach(
    memory => {

      if (
        !memory.photos ||
        !Array.isArray(
          memory.photos
        )
      ) {

        return;

      }


      memory.photos.forEach(
        photo => {

          if (
            photo &&
            photo.image_url
          ) {

            recentPreviewPhotos.push({

              url:
                photo.image_url,

              caption:
                memory.description || "",

              date:
                memory.date_display || "",

              location:
                memory.location || ""

            });

          }

        }
      );

    }
  );


  /*
   * Tidak ada foto.
   */

  if (
    recentPreviewPhotos.length === 0
  ) {

    container.innerHTML = "";

    return;

  }


  /*
   * ========================================
   * PERSIAPAN FOTO
   * ========================================
   *
   * Minimal kita membutuhkan 3 foto
   * untuk memenuhi viewport.
   *
   * Jika hanya ada 1 atau 2 foto,
   * foto akan diulang.
   */

  let basePhotos =
    [...recentPreviewPhotos];


  if (
    basePhotos.length <
    recentPreviewVisibleCount
  ) {

    const original =
      [...basePhotos];


    if (
      original.length > 0
    ) {

      while (
        basePhotos.length <
        recentPreviewVisibleCount
      ) {

        basePhotos.push(
          original[
            basePhotos.length %
              original.length
          ]
        );

      }

    }

  }


  /*
   * ========================================
   * INFINITE TRACK
   * ========================================
   *
   * Kita render beberapa putaran sekaligus.
   *
   * Dengan 5 foto:
   *
   * 1 2 3 4 5
   * 1 2 3 4 5
   * 1 2 3 4 5
   *
   * Jadi browser sudah memiliki
   * foto berikutnya sebelum animasi berjalan.
   *
   * Kita menggunakan 4 set agar
   * tidak terjadi visible reset.
   */

  const repeatCount = 4;


  const carouselPhotos = [];


  for (
    let i = 0;
    i < repeatCount;
    i++
  ) {

    carouselPhotos.push(
      ...basePhotos
    );

  }


  /*
   * ========================================
   * INITIAL POSITION
   * ========================================
   *
   * Kita mulai dari set kedua.
   *
   * Misalnya:
   *
   * SET 1:
   * 1 2 3 4 5
   *
   * SET 2:
   * 1 2 3 4 5
   *
   * SET 3:
   * 1 2 3 4 5
   *
   * SET 4:
   * 1 2 3 4 5
   *
   *
   * Posisi awal berada di:
   *
   * SET 2 -> 1 2 3
   *
   * Sehingga masih ada ruang
   * untuk bergerak ke kiri maupun kanan.
   */

  recentPreviewIndex =
    basePhotos.length;


  /*
   * ========================================
   * HTML
   * ========================================
   */

  container.innerHTML = `

    <div class="recent-preview-wrapper">

      <div
        class="recent-preview-track"
        id="recentPreviewTrack"
      >

        ${
          carouselPhotos
            .map(
              (photo, index) => `

                <div
                  class="recent-preview-item"
                  data-preview-index="${index}"
                >

                  <img
                    src="${escapeAttribute(
                      photo.url
                    )}"
                    alt="${escapeAttribute(
                      photo.caption
                    )}"
                    loading="eager"
                    decoding="async"
                    draggable="false"
                  >

                </div>

              `
            )
            .join("")
        }

      </div>

    </div>

  `;


  /*
   * ========================================
   * IMAGE CLICK EVENT
   * ========================================
   */

  const images =
    container.querySelectorAll(
      ".recent-preview-item img"
    );


  images.forEach(
    (img, index) => {

      img.addEventListener(
        "click",
        () => {

          const photo =
            carouselPhotos[index];


          if (!photo) {

            return;

          }


          openPhotoPreview(
            photo.url,
            photo.caption
          );

        }
      );

    }
  );


  /*
   * ========================================
   * PRELOAD
   * ========================================
   *
   * Semua foto sudah kita preload.
   *
   * Jadi ketika foto 4 atau 5 masuk
   * ke viewport, browser tidak baru
   * mulai mengambil gambarnya.
   */

  preloadRecentPreviewImages(
    basePhotos
  );


  /*
   * Tunggu layout selesai sebelum
   * menentukan posisi awal.
   */

  requestAnimationFrame(
    () => {

      requestAnimationFrame(
        () => {

          setRecentPreviewPosition(
            false
          );


          /*
           * Mulai animasi jika foto
           * lebih dari 3.
           */

          if (
            basePhotos.length >
            recentPreviewVisibleCount
          ) {

            startRecentMomentsAnimation();

          }

        }
      );

    }
  );

}


/* ============================================
   PRELOAD RECENT PREVIEW IMAGES
============================================ */

function preloadRecentPreviewImages(
  photos
) {

  if (
    !photos ||
    photos.length === 0
  ) {

    return;

  }


  photos.forEach(
    photo => {

      if (
        !photo ||
        !photo.url
      ) {

        return;

      }


      const img =
        new Image();


      img.decoding =
        "async";


      img.src =
        photo.url;

    }
  );

}


/* ============================================
   GET CAROUSEL METRICS
============================================ */

function getRecentPreviewMetrics() {

  const track =
    document.getElementById(
      "recentPreviewTrack"
    );


  if (!track) {

    return null;

  }


  const items =
    track.querySelectorAll(
      ".recent-preview-item"
    );


  if (
    items.length === 0
  ) {

    return null;

  }


  const firstItem =
    items[0];


  const itemRect =
    firstItem.getBoundingClientRect();


  const itemWidth =
    itemRect.width;


  const trackStyle =
    window.getComputedStyle(
      track
    );


  let gap =
    parseFloat(
      trackStyle.columnGap
    );


  if (
    Number.isNaN(gap)
  ) {

    gap =
      parseFloat(
        trackStyle.gap
      );

  }


  if (
    Number.isNaN(gap)
  ) {

    gap = 0;

  }


  return {

    track,

    items,

    itemWidth,

    gap,

    step:
      itemWidth + gap

  };

}


/* ============================================
   SET INITIAL POSITION
============================================ */

function setRecentPreviewPosition(
  animate = false
) {

  const metrics =
    getRecentPreviewMetrics();


  if (!metrics) {

    return;

  }


  const {
    track,
    step
  } = metrics;


  const translateX =
    recentPreviewIndex *
    step;


  if (animate) {

    track.style.transition =
      "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)";

  } else {

    track.style.transition =
      "none";

  }


  track.style.transform =
    `translate3d(-${translateX}px, 0, 0)`;

}


/* ============================================
   START RECENT MOMENTS ANIMATION
============================================ */

function startRecentMomentsAnimation() {

  /*
   * Stop interval lama.
   */

  stopRecentMomentsAnimation();


  /*
   * Pastikan state animasi reset.
   */

  recentPreviewIsAnimating =
    false;


  /*
   * Mulai interval.
   *
   * Setiap 2.8 detik satu posisi bergeser.
   */

  recentPreviewInterval =
    setInterval(
      () => {

        rotateRecentMomentPhoto();

      },
      2800
    );

}


/* ============================================
   STOP RECENT MOMENTS ANIMATION
============================================ */

function stopRecentMomentsAnimation() {

  if (
    recentPreviewInterval
  ) {

    clearInterval(
      recentPreviewInterval
    );


    recentPreviewInterval =
      null;

  }

}


/* ============================================
   ROTATE RECENT MOMENT PHOTO
============================================ */

function rotateRecentMomentPhoto() {

  /*
   * Hindari double animation.
   */

  if (
    recentPreviewIsAnimating
  ) {

    return;

  }


  const metrics =
    getRecentPreviewMetrics();


  if (!metrics) {

    return;

  }


  const {
    track,
    step
  } = metrics;


  const totalOriginalPhotos =
    recentPreviewPhotos.length;


  /*
   * Jika tidak cukup foto,
   * tidak perlu melakukan carousel.
   */

  if (
    totalOriginalPhotos <=
    recentPreviewVisibleCount
  ) {

    return;

  }


  /*
   * Tandai sedang animasi.
   */

  recentPreviewIsAnimating =
    true;


  /*
   * Geser satu posisi.
   */

  recentPreviewIndex++;


  const translateX =
    recentPreviewIndex *
    step;


  /*
   * Smooth animation.
   */

  track.style.transition =
    "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)";


  track.style.transform =
    `translate3d(-${translateX}px, 0, 0)`;


  /*
   * Tunggu transition selesai.
   */

  const handleTransitionEnd =
    event => {

      /*
       * Pastikan transition berasal
       * dari transform track.
       */

      if (
        event.propertyName !==
        "transform"
      ) {

        return;

      }


      track.removeEventListener(
        "transitionend",
        handleTransitionEnd
      );


      /*
       * ====================================
       * INFINITE LOOP POSITION
       * ====================================
       */

      const baseLength =
        totalOriginalPhotos;


      /*
       * Jika sudah masuk terlalu jauh
       * ke set berikutnya, pindahkan
       * kembali ke set kedua.
       */

      if (
        recentPreviewIndex >=
        baseLength * 2
      ) {

        recentPreviewIndex =
          recentPreviewIndex -
          baseLength;


        const resetTranslateX =
          recentPreviewIndex *
          step;


        /*
         * Matikan transition sementara.
         */

        track.style.transition =
          "none";


        track.style.transform =
          `translate3d(-${resetTranslateX}px, 0, 0)`;


        /*
         * Force browser repaint.
         */

        void track.offsetWidth;

      }


      /*
       * Animasi selesai.
       */

      recentPreviewIsAnimating =
        false;

    };


  track.addEventListener(
    "transitionend",
    handleTransitionEnd
  );

}


/* ============================================
   HANDLE WINDOW RESIZE
============================================ */

let recentPreviewResizeTimer =
  null;


window.addEventListener(
  "resize",
  () => {

    clearTimeout(
      recentPreviewResizeTimer
    );


    recentPreviewResizeTimer =
      setTimeout(
        () => {

          /*
           * Recalculate posisi setelah
           * ukuran item berubah.
           */

          setRecentPreviewPosition(
            false
          );

        },
        150
      );

  }
);


/* ============================================
   CALENDAR
============================================ */

function renderCalendar() {

  const calendarDays =
    document.getElementById(
      "calendarDays"
    );


  if (!calendarDays) {

    return;

  }


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
    ).format(
      currentDate
    );


  const monthElement =
    document.getElementById(
      "calendarMonth"
    );


  const yearElement =
    document.getElementById(
      "calendarYear"
    );


  if (monthElement) {

    monthElement.textContent =
      monthName;

  }


  if (yearElement) {

    yearElement.textContent =
      year;

  }


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
   *
   * Sunday = 0
   *
   * Kita ingin:
   *
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


    /*
     * TODAY
     */

    const today =
      new Date();


    const todayString =
      formatDateISO(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );


    if (
      dateString ===
      todayString
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


  if (!container) {

    return;

  }


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
            src="${escapeAttribute(
              photo
            )}"
            alt="${escapeAttribute(
              memory.description
            )}"
          >

        `
        : ""
    }

  `;


  /*
   * Event listener foto.
   */

  if (photo) {

    const selectedPhoto =
      container.querySelector(
        ".selected-photo"
      );


    if (selectedPhoto) {

      selectedPhoto.addEventListener(
        "click",
        () => {

          openPhotoPreview(
            photo,
            memory.description || ""
          );

        }
      );

    }

  }


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


  if (!container) {

    return;

  }


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

  const display = important;


  if (
    display.length === 0
  ) {

    container.innerHTML =
      "<p>No important dates yet.</p>";

    return;

  }


  /*
   * Clear container
   */

  container.innerHTML =
    "";


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
        ).format(
          date
        );


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


          const moments =
            document.getElementById(
              "moments"
            );


          if (moments) {

            moments.scrollIntoView({
              behavior: "smooth"
            });

          }

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


      const element =
        document.getElementById(
          categories[category]
        );


      if (element) {

        element.textContent =
          count;

      }

    }
  );

}


/* ============================================
   FEATURED MOMENTS
============================================ */

/*
 * A Few Moments
 *
 * Urutan:
 *
 * OLDEST → NEWEST
 *
 * Contoh:
 *
 * 2024 → 2025 → 2026
 *
 * Tujuannya agar section ini tidak
 * menduplikasi fungsi carousel hero
 * yang menggunakan:
 *
 * NEWEST → OLDEST
 */

function renderFeaturedMoments() {

  const container =
    document.getElementById(
      "featuredMoments"
    );


  if (!container) {

    return;

  }


  /*
   * Clear container
   */

  container.innerHTML =
    "";


  /*
   * ========================================
   * AMBIL MOMENTS
   * ========================================
   *
   * Berbeda dengan carousel hero,
   * section ini menggunakan chronological
   * ascending order.
   *
   * OLD → NEW
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
          new Date(a.date) -
          new Date(b.date)
      );


  /*
   * ========================================
   * 5 MOMENTS PALING AWAL
   * ========================================
   *
   * Karena sudah ascending,
   * slice(0, 5) berarti mengambil
   * 5 moment paling lama.
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


  /*
   * ========================================
   * RENDER CARD
   * ========================================
   */

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
                src="${escapeAttribute(
                  photo
                )}"
                alt="${escapeAttribute(
                  memory.description
                )}"
                loading="lazy"
                decoding="async"
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


      /*
       * ====================================
       * CARD CLICK
       * ====================================
       */

      card.addEventListener(
        "click",
        () => {

          selectDate(
            memory.date
          );

        }
      );


      /*
       * ====================================
       * IMAGE CLICK
       * ====================================
       */

      if (photo) {

        const image =
          card.querySelector(
            ".featured-image"
          );


        if (image) {

          image.addEventListener(
            "click",
            event => {

              event.stopPropagation();


              openPhotoPreview(
                photo,
                memory.description || ""
              );

            }
          );

        }

      }


      container.appendChild(
        card
      );

    }
  );

}


/* ============================================
   MONTH NAVIGATION
============================================ */

const previousMonthButton =
  document.getElementById(
    "previousMonth"
  );


if (
  previousMonthButton
) {

  previousMonthButton.addEventListener(
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

}


const nextMonthButton =
  document.getElementById(
    "nextMonth"
  );


if (
  nextMonthButton
) {

  nextMonthButton.addEventListener(
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

}


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


/* ============================================
   FORMAT DATE
============================================ */

function formatDateISO(
  year,
  month,
  day
) {

  return (

    year +

    "-" +

    String(month)
      .padStart(
        2,
        "0"
      ) +

    "-" +

    String(day)
      .padStart(
        2,
        "0"
      )

  );

}


/* ============================================
   ESCAPE HTML
============================================ */

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
   ESCAPE ATTRIBUTE
============================================ */

function escapeAttribute(
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
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    );

}


/* ============================================
   BUTTONS
============================================ */

function scrollToMoments() {

  const moments =
    document.getElementById(
      "moments"
    );


  if (!moments) {

    return;

  }


  moments.scrollIntoView({
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


  if (!container) {

    return;

  }


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


  /*
   * Set image.
   */

  image.src =
    imageUrl;


  /*
   * Set caption.
   */

  if (
    captionElement
  ) {

    captionElement.textContent =
      caption || "";

  }


  /*
   * Open modal.
   */

  modal.classList.add(
    "active"
  );


  /*
   * Prevent background scrolling.
   */

  document.body.style.overflow =
    "hidden";

}


/* ============================================
   CLOSE PHOTO LIGHTBOX
============================================ */

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


  /*
   * Close modal.
   */

  modal.classList.remove(
    "active"
  );


  /*
   * Restore scrolling.
   */

  document.body.style.overflow =
    "";


  /*
   * Clear image after transition.
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


/* ============================================
   CLOSE LIGHTBOX WITH ESC
============================================ */

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


/* ============================================
   STOP CAROUSEL WHEN PAGE IS HIDDEN
============================================ */

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.hidden
    ) {

      stopRecentMomentsAnimation();

    } else {

      if (
        recentPreviewPhotos.length >
        recentPreviewVisibleCount
      ) {

        startRecentMomentsAnimation();

      }

    }

  }
);