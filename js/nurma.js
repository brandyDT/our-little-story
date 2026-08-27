/* ============================================
   CONFIGURATION
============================================ */

const API_URL =
  "https://script.google.com/macros/s/AKfycbz6mbC7UdVaXYbRGwV_t1hHeVHSJjTnzQIr9Ex8nEcgaEOWEdWNdUAlhpr69GJE5XWe/exec";


/* ============================================
   GLOBAL
============================================ */

let memories = [];

let selectedYear = null;
let selectedMonth = null;
let selectedDate = null;


/* ============================================
   INITIALIZE
============================================ */

document.addEventListener(
  "DOMContentLoaded",
  function () {
    initializeFilters();
    loadMoments();
  }
);


/* ============================================
   LOAD DATA
============================================ */

async function loadMoments() {

  try {

    console.log(
      "Loading moments..."
    );


    const response =
      await fetch(
        API_URL,
        {
          method: "GET",
          cache: "no-store"
        }
      );


    if (!response.ok) {

      throw new Error(
        "API request failed: " +
        response.status
      );

    }


    const data =
      await response.json();


    console.log(
      "API response:",
      data
    );


    /* ==========================================
       NORMALIZE API RESPONSE
    ========================================== */

    let rawData = [];


    if (
      Array.isArray(data)
    ) {

      rawData = data;

    }

    else if (
      data &&
      Array.isArray(data.data)
    ) {

      rawData = data.data;

    }

    else if (
      data &&
      Array.isArray(data.results)
    ) {

      rawData = data.results;

    }

    else {

      throw new Error(
        "API response is not an array"
      );

    }


    /* ==========================================
       FILTER MOMENTS
    ========================================== */

    memories =
      rawData

        .filter(
          function (memory) {

            if (!memory) {
              return false;
            }


            const category =
              String(
                memory.category || ""
              )
                .trim()
                .toLowerCase();


            return (
              category === "nurma"
            );

          }
        )

        .filter(
          function (memory) {

            return isValidDateString(
              memory.date
            );

          }
        )

        .sort(
          function (a, b) {

            return (
              parseDate(a.date) -
              parseDate(b.date)
            );

          }
        );


    console.log(
      "Moments loaded:",
      memories
    );


    /* ==========================================
       UPDATE FILTER
    ========================================== */

    populateYearFilter();

    updateMonthFilter();

    updateDateFilter();

    updateFilterButtons();

    updateFilterVisibility();


    /* ==========================================
       RENDER
    ========================================== */

    renderMoments();

  }


  catch (error) {

    console.error(
      "Error loading moments:",
      error
    );


    showError(
      error.message
    );

  }

}


/* ============================================
   INITIALIZE FILTERS
============================================ */

function initializeFilters() {

  const yearDropdown =
    document.getElementById(
      "yearDropdown"
    );


  const monthDropdown =
    document.getElementById(
      "monthDropdown"
    );


  const dateDropdown =
    document.getElementById(
      "dateDropdown"
    );


  if (
    !yearDropdown ||
    !monthDropdown ||
    !dateDropdown
  ) {

    console.error(
      "Elemen filter tidak ditemukan."
    );

    return;

  }


  /* ==========================================
     YEAR BUTTON
  ========================================== */

  const yearButton =
    document.getElementById(
      "yearButton"
    );


  if (yearButton) {

    yearButton.addEventListener(
      "click",
      function (event) {

        event.stopPropagation();

        toggleDropdown(
          yearDropdown
        );

      }
    );

  }


  /* ==========================================
     MONTH BUTTON
  ========================================== */

  const monthButton =
    document.getElementById(
      "monthButton"
    );


  if (monthButton) {

    monthButton.addEventListener(
      "click",
      function (event) {

        event.stopPropagation();


        if (
          monthDropdown.classList.contains(
            "disabled"
          )
        ) {

          return;

        }


        toggleDropdown(
          monthDropdown
        );

      }
    );

  }


  /* ==========================================
     DATE BUTTON
  ========================================== */

  const dateButton =
    document.getElementById(
      "dateButton"
    );


  if (dateButton) {

    dateButton.addEventListener(
      "click",
      function (event) {

        event.stopPropagation();


        if (
          dateDropdown.classList.contains(
            "disabled"
          )
        ) {

          return;

        }


        toggleDropdown(
          dateDropdown
        );

      }
    );

  }


  /* ==========================================
     CLOSE WHEN CLICK OUTSIDE
  ========================================== */

  document.addEventListener(
    "click",
    function (event) {

      if (
        !event.target.closest(
          ".filter-dropdown"
        )
      ) {

        closeAllDropdowns();

      }

    }
  );


  updateFilterVisibility();

}


/* ============================================
   TOGGLE DROPDOWN
============================================ */

function toggleDropdown(
  dropdown
) {

  if (!dropdown) {
    return;
  }


  const isOpen =
    dropdown.classList.contains(
      "open"
    );


  closeAllDropdowns();


  if (!isOpen) {

    dropdown.classList.add(
      "open"
    );


    const button =
      dropdown.querySelector(
        ".filter-button"
      );


    if (button) {

      button.setAttribute(
        "aria-expanded",
        "true"
      );

    }

  }

}


/* ============================================
   CLOSE ALL DROPDOWNS
============================================ */

function closeAllDropdowns() {

  document
    .querySelectorAll(
      ".filter-dropdown"
    )
    .forEach(
      function (dropdown) {

        dropdown.classList.remove(
          "open"
        );


        const button =
          dropdown.querySelector(
            ".filter-button"
          );


        if (button) {

          button.setAttribute(
            "aria-expanded",
            "false"
          );

        }

      }
    );

}


/* ============================================
   POPULATE YEAR FILTER
============================================ */

function populateYearFilter() {

  const menu =
    document.getElementById(
      "yearFilter"
    );


  if (!menu) {
    return;
  }


  menu.innerHTML = "";


  createFilterOption(
    menu,
    "Semua Tahun",
    null,
    "year"
  );


  const years =
    getAvailableYears();


  years.forEach(
    function (year) {

      createFilterOption(
        menu,
        String(year),
        year,
        "year"
      );

    }
  );


  updateSelectedOption(
    menu,
    "year",
    selectedYear
  );

}


/* ============================================
   UPDATE MONTH FILTER
============================================ */

function updateMonthFilter() {

  const menu =
    document.getElementById(
      "monthFilter"
    );


  if (!menu) {
    return;
  }


  menu.innerHTML = "";


  createFilterOption(
    menu,
    "Semua Bulan",
    null,
    "month"
  );


  if (
    selectedYear === null
  ) {

    updateSelectedOption(
      menu,
      "month",
      null
    );

    return;

  }


  const months =
    [
      ...new Set(
        memories
          .filter(
            function (memory) {

              const parts =
                getDateParts(
                  memory.date
                );


              return (
                parts.year ===
                selectedYear
              );

            }
          )
          .map(
            function (memory) {

              return getDateParts(
                memory.date
              ).month;

            }
          )
      )
    ]
      .sort(
        function (a, b) {

          return a - b;

        }
      );


  months.forEach(
    function (month) {

      createFilterOption(
        menu,
        getMonthName(month),
        month,
        "month"
      );

    }
  );


  updateSelectedOption(
    menu,
    "month",
    selectedMonth
  );

}


/* ============================================
   UPDATE DATE FILTER
============================================ */

function updateDateFilter() {

  const menu =
    document.getElementById(
      "dateFilter"
    );


  if (!menu) {
    return;
  }


  menu.innerHTML = "";


  createFilterOption(
    menu,
    "Semua Tanggal",
    null,
    "date"
  );


  if (
    selectedYear === null ||
    selectedMonth === null
  ) {

    updateSelectedOption(
      menu,
      "date",
      null
    );

    return;

  }


  const dates =
    [
      ...new Set(
        memories
          .filter(
            function (memory) {

              const parts =
                getDateParts(
                  memory.date
                );


              return (
                parts.year ===
                  selectedYear &&
                parts.month ===
                  selectedMonth
              );

            }
          )
          .map(
            function (memory) {

              return normalizeDate(
                memory.date
              );

            }
          )
      )
    ]
      .sort(
        function (a, b) {

          return (
            parseDate(a) -
            parseDate(b)
          );

        }
      );


  dates.forEach(
    function (date) {

      createFilterOption(
        menu,
        formatDateFilter(date),
        date,
        "date"
      );

    }
  );


  updateSelectedOption(
    menu,
    "date",
    selectedDate
  );

}


/* ============================================
   CREATE FILTER OPTION
============================================ */

function createFilterOption(
  menu,
  label,
  value,
  type
) {

  if (!menu) {
    return;
  }


  const button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "filter-option";


  button.textContent =
    label;


  button.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();


      selectFilter(
        type,
        value
      );

    }
  );


  menu.appendChild(
    button
  );

}


/* ============================================
   SELECT FILTER
============================================ */

function selectFilter(
  type,
  value
) {

  /* ==========================================
     YEAR
  ========================================== */

  if (
    type === "year"
  ) {

    selectedYear =
      value !== null
        ? Number(value)
        : null;


    selectedMonth =
      null;


    selectedDate =
      null;

  }


  /* ==========================================
     MONTH
  ========================================== */

  if (
    type === "month"
  ) {

    selectedMonth =
      value !== null
        ? Number(value)
        : null;


    selectedDate =
      null;

  }


  /* ==========================================
     DATE
  ========================================== */

  if (
    type === "date"
  ) {

    selectedDate =
      value !== null
        ? value
        : null;

  }


  closeAllDropdowns();


  updateMonthFilter();

  updateDateFilter();

  updateFilterButtons();

  updateFilterVisibility();


  renderMoments();

}


/* ============================================
   UPDATE FILTER BUTTON TEXT
============================================ */

function updateFilterButtons() {

  const yearText =
    document.getElementById(
      "yearButtonText"
    );


  const monthText =
    document.getElementById(
      "monthButtonText"
    );


  const dateText =
    document.getElementById(
      "dateButtonText"
    );


  if (yearText) {

    yearText.textContent =
      selectedYear !== null
        ? String(selectedYear)
        : "Tahun";

  }


  if (monthText) {

    monthText.textContent =
      selectedMonth !== null
        ? getMonthName(
            selectedMonth
          )
        : "Bulan";

  }


  if (dateText) {

    dateText.textContent =
      selectedDate !== null
        ? formatDateFilter(
            selectedDate
          )
        : "Tanggal";

  }

}


/* ============================================
   UPDATE SELECTED OPTION
============================================ */

function updateSelectedOption(
  menu,
  type,
  selectedValue
) {

  if (!menu) {
    return;
  }


  const options =
    menu.querySelectorAll(
      ".filter-option"
    );


  options.forEach(
    function (
      option,
      index
    ) {

      option.classList.remove(
        "selected"
      );


      if (
        selectedValue === null &&
        index === 0
      ) {

        option.classList.add(
          "selected"
        );

        return;

      }


      if (
        selectedValue === null
      ) {

        return;

      }


      const label =
        option.textContent.trim();


      let isSelected =
        false;


      if (
        type === "year"
      ) {

        isSelected =
          Number(label) ===
          Number(selectedValue);

      }


      else if (
        type === "month"
      ) {

        isSelected =
          label ===
          getMonthName(
            selectedValue
          );

      }


      else if (
        type === "date"
      ) {

        isSelected =
          label ===
          formatDateFilter(
            selectedValue
          );

      }


      if (isSelected) {

        option.classList.add(
          "selected"
        );

      }

    }
  );

}


/* ============================================
   FILTER VISIBILITY
============================================ */

function updateFilterVisibility() {

  const yearDropdown =
    document.getElementById(
      "yearDropdown"
    );


  const monthDropdown =
    document.getElementById(
      "monthDropdown"
    );


  const dateDropdown =
    document.getElementById(
      "dateDropdown"
    );


  /* ==========================================
     YEAR ALWAYS ACTIVE
  ========================================== */

  if (yearDropdown) {

    yearDropdown.classList.remove(
      "disabled"
    );

  }


  /* ==========================================
     MONTH ACTIVE AFTER YEAR
  ========================================== */

  if (monthDropdown) {

    if (
      selectedYear !== null
    ) {

      monthDropdown.classList.remove(
        "disabled"
      );

    }

    else {

      monthDropdown.classList.add(
        "disabled"
      );

    }

  }


  /* ==========================================
     DATE ACTIVE AFTER YEAR + MONTH
  ========================================== */

  if (dateDropdown) {

    if (
      selectedYear !== null &&
      selectedMonth !== null
    ) {

      dateDropdown.classList.remove(
        "disabled"
      );

    }

    else {

      dateDropdown.classList.add(
        "disabled"
      );

    }

  }

}


/* ============================================
   GET AVAILABLE YEARS
============================================ */

function getAvailableYears() {

  return [
    ...new Set(
      memories.map(
        function (memory) {

          return getDateParts(
            memory.date
          ).year;

        }
      )
    )
  ]
    .sort(
      function (a, b) {

        return a - b;

      }
    );

}


/* ============================================
   RENDER MOMENTS
============================================ */

function renderMoments() {

  const container =
    document.getElementById(
      "momentsTimeline"
    );


  if (!container) {

    console.error(
      "Element #momentsTimeline not found."
    );

    return;

  }


  /* ==========================================
     FILTER DATA
  ========================================== */

  const filteredMemories =
    memories.filter(
      function (memory) {

        const parts =
          getDateParts(
            memory.date
          );


        /* YEAR */

        if (
          selectedYear !== null &&
          parts.year !==
            selectedYear
        ) {

          return false;

        }


        /* MONTH */

        if (
          selectedMonth !== null &&
          parts.month !==
            selectedMonth
        ) {

          return false;

        }


        /* DATE */

        if (
          selectedDate !== null &&
          normalizeDate(
            memory.date
          ) !==
            selectedDate
        ) {

          return false;

        }


        return true;

      }
    );


  container.innerHTML =
    "";


  /* ==========================================
     EMPTY
  ========================================== */

  if (
    filteredMemories.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-state">
        <h2>
          No moments yet
        </h2>

        <p>
          Our story is still waiting
          for its next chapter.
        </p>
      </div>
    `;

    return;

  }


  /* ==========================================
     GROUP BY EXACT DATE
  ========================================== */

  const groupedByDate = {};


  filteredMemories.forEach(
    function (memory) {

      const date =
        normalizeDate(
          memory.date
        );


      if (!date) {
        return;
      }


      if (
        !groupedByDate[date]
      ) {

        groupedByDate[date] =
          [];

      }


      groupedByDate[date].push(
        memory
      );

    }
  );


  /* ==========================================
     GROUP BY YEAR
  ========================================== */

  const groupedByYear = {};


  Object.keys(
    groupedByDate
  )
    .forEach(
      function (date) {

        const parts =
          getDateParts(
            date
          );


        const year =
          parts.year;


        if (
          !groupedByYear[year]
        ) {

          groupedByYear[year] =
            [];

        }


        groupedByYear[year].push(
          date
        );

      }
    );


  /* ==========================================
     RENDER YEAR
  ========================================== */

  Object.keys(
    groupedByYear
  )
    .sort(
      function (a, b) {

        return (
          Number(a) -
          Number(b)
        );

      }
    )
    .forEach(
      function (year) {

        const yearSection =
          document.createElement(
            "section"
          );


        yearSection.className =
          "year-section";


        /* ====================================
           YEAR TITLE
        ==================================== */

        const yearTitle =
          document.createElement(
            "div"
          );


        yearTitle.className =
          "year-title";


        yearTitle.textContent =
          year;


        yearSection.appendChild(
          yearTitle
        );


        /* ====================================
           TIMELINE
        ==================================== */

        const timeline =
          document.createElement(
            "div"
          );


        timeline.className =
          "timeline";


        groupedByYear[year]
          .sort(
            function (a, b) {

              return (
                parseDate(a) -
                parseDate(b)
              );

            }
          )
          .forEach(
            function (date) {

              timeline.appendChild(
                createDateTimelineItem(
                  groupedByDate[date]
                )
              );

            }
          );


        yearSection.appendChild(
          timeline
        );


        container.appendChild(
          yearSection
        );

      }
    );


  /* ==========================================
     INITIALIZE COMPONENTS
  ========================================== */

  setTimeout(
    function () {

      initializeCaptionExpansion();

      initializeGalleryScrollButtons();

    },
    50
  );

}


/* ============================================
   CREATE DATE TIMELINE ITEM
============================================ */

function createDateTimelineItem(
  dateMemories
) {

  const item =
    document.createElement(
      "article"
    );


  item.className =
    "memory-item";


  /* ==========================================
     DATE INFO
  ========================================== */

  const parts =
    getDateParts(
      dateMemories[0].date
    );


  const day =
    String(
      parts.day
    )
      .padStart(
        2,
        "0"
      );


  const month =
    getMonthShortName(
      parts.month
    );


  /* ==========================================
     BUILD GALLERY
  ========================================== */

  let memoriesHTML =
    "";


  dateMemories.forEach(
    function (memory) {

      const location =
        escapeHTML(
          memory.location
        );


      const caption =
        escapeHTML(
          memory.description
        );


      const rawCaption =
        memory.description ||
        "";


      /* ========================================
         MEMORY WITH PHOTOS
      ======================================== */

      if (
        Array.isArray(
          memory.photos
        ) &&
        memory.photos.length > 0
      ) {

        memory.photos

          .filter(
            function (photo) {

              return (
                photo &&
                photo.image_url
              );

            }
          )

          .forEach(
            function (photo) {

              const imageUrl =
                escapeHTML(
                  photo.image_url
                );


              const jsImageUrl =
                escapeJS(
                  photo.image_url
                );


              const jsCaption =
                escapeJS(
                  rawCaption
                );


              /* ==================================
                 PHOTO CARD
              ================================== */

              memoriesHTML += `
                <div class="memory-photo-card">

                  ${
                    location
                      ? `
                        <div class="memory-photo-location">
                          ${location}
                        </div>
                      `
                      : ""
                  }


                  <div class="memory-photo-wrapper">

                    <img
                      class="memory-photo"
                      src="${imageUrl}"
                      alt="${caption}"
                      loading="lazy"
                      onclick="openPhotoPreview('${jsImageUrl}', '${jsCaption}')"
                    >

                  </div>


                  ${
                    caption
                      ? `
                        <div class="caption-container">

                          <div
                            class="memory-photo-caption"
                          >
                            ${caption}
                          </div>

                        </div>
                      `
                      : ""
                  }

                </div>
              `;

            }
          );

      }


      /* ========================================
         MEMORY WITHOUT PHOTO
      ======================================== */

      else {

        memoriesHTML += `
          <div class="memory-photo-card">

            ${
              location
                ? `
                  <div class="memory-photo-location">
                    ${location}
                  </div>
                `
                : ""
            }


            ${
              caption
                ? `
                  <div class="memory-caption-only">
                    ${caption}
                  </div>
                `
                : ""
            }

          </div>
        `;

      }

    }
  );


  /* ==========================================
     COUNT VALID PHOTOS
     
     PENTING:
     Tombol arrow hanya dibuat apabila
     jumlah foto > 2.
  ========================================== */

  let totalPhotos = 0;


  dateMemories.forEach(
    function (memory) {

      if (
        Array.isArray(
          memory.photos
        )
      ) {

        totalPhotos +=
          memory.photos.filter(
            function (photo) {

              return (
                photo &&
                photo.image_url
              );

            }
          ).length;

      }

    }
  );


  /*
    TRUE hanya apabila terdapat
    3 foto atau lebih.
  */

  const shouldShowScrollButton =
    totalPhotos > 2;


  /* ==========================================
     FINAL HTML
  ========================================== */

  item.innerHTML = `

    <div class="memory-date">

      <div class="memory-day">
        ${day}
      </div>

      <div class="memory-month">
        ${month}
      </div>

    </div>


    <div class="memory-content">

      <div class="memory-dot"></div>


      <div class="memory-card">

        <div class="memory-gallery">

          ${memoriesHTML}

        </div>


        ${
          shouldShowScrollButton
            ? `
              <button
                type="button"
                class="gallery-scroll-right"
                aria-label="Geser ke foto paling kanan"
                title="Lihat foto berikutnya"
              >
                →
              </button>
            `
            : ""
        }

      </div>

    </div>

  `;


  return item;

}


/* ============================================
   CAPTION EXPANSION
============================================ */

function initializeCaptionExpansion() {

  const captions =
    document.querySelectorAll(
      ".memory-photo-caption"
    );


  captions.forEach(
    function (caption) {

      /* ========================================
         RESET STATE
      ======================================== */

      caption.classList.remove(
        "expandable"
      );


      caption.classList.remove(
        "expanded"
      );


      /* ========================================
         CHECK OVERFLOW
      ======================================== */

      let isOverflowing =
        false;


      const computedStyle =
        window.getComputedStyle(
          caption
        );


      const lineHeight =
        parseFloat(
          computedStyle.lineHeight
        );


      const maxHeight =
        parseFloat(
          computedStyle.maxHeight
        );


      /* ========================================
         PRIMARY CHECK
      ======================================== */

      if (
        caption.scrollHeight >
        caption.clientHeight + 2
      ) {

        isOverflowing = true;

      }


      /* ========================================
         MAX HEIGHT CHECK
      ======================================== */

      if (
        !isNaN(maxHeight) &&
        maxHeight > 0 &&
        caption.scrollHeight >
        maxHeight + 2
      ) {

        isOverflowing = true;

      }


      /* ========================================
         THREE LINE CHECK
      ======================================== */

      if (
        !isNaN(lineHeight) &&
        caption.scrollHeight >
        lineHeight * 3 + 2
      ) {

        isOverflowing = true;

      }


      /* ========================================
         NOT OVERFLOWING
      ======================================== */

      if (!isOverflowing) {

        return;

      }


      /* ========================================
         MAKE EXPANDABLE
      ======================================== */

      caption.classList.add(
        "expandable"
      );


      /* ========================================
         CLICK EVENT
      ======================================== */

      caption.addEventListener(
        "click",
        function (event) {

          event.stopPropagation();


          const isExpanded =
            caption.classList.contains(
              "expanded"
            );


          if (isExpanded) {

            caption.classList.remove(
              "expanded"
            );

          }

          else {

            caption.classList.add(
              "expanded"
            );

          }

        }
      );

    }
  );

}


/* ============================================
   GALLERY HORIZONTAL SCROLL BUTTON
============================================ */

function initializeGalleryScrollButtons() {

  const galleries =
    document.querySelectorAll(
      ".memory-gallery"
    );


  galleries.forEach(
    function (gallery) {

      const card =
        gallery.closest(
          ".memory-card"
        );


      if (!card) {
        return;
      }


      const button =
        card.querySelector(
          ".gallery-scroll-right"
        );


      /*
        Tidak ada button berarti gallery
        memang hanya memiliki <= 2 foto.

        Jadi langsung skip.
      */

      if (!button) {
        return;
      }


      /* ========================================
         CHECK INITIAL STATE
      ======================================== */

      updateGalleryScrollButton(
        gallery,
        button
      );


      /* ========================================
         CLICK
      ======================================== */

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();

          event.stopPropagation();


          gallery.scrollTo(
            {
              left:
                gallery.scrollWidth,
              behavior:
                "smooth"
            }
          );

        }
      );


      /* ========================================
         UPDATE AFTER SCROLL
      ======================================== */

      gallery.addEventListener(
        "scroll",
        function () {

          updateGalleryScrollButton(
            gallery,
            button
          );

        },
        {
          passive: true
        }
      );


      /* ========================================
         RESIZE
      ======================================== */

      window.addEventListener(
        "resize",
        function () {

          updateGalleryScrollButton(
            gallery,
            button
          );

        }
      );

    }
  );

}


/* ============================================
   UPDATE GALLERY SCROLL BUTTON
============================================ */

function updateGalleryScrollButton(
  gallery,
  button
) {

  if (
    !gallery ||
    !button
  ) {

    return;

  }


  /* ==========================================
     CHECK HORIZONTAL SCROLL
  ========================================== */

  const hasHorizontalScroll =
    gallery.scrollWidth >
    gallery.clientWidth + 5;


  /* ==========================================
     CHECK RIGHT POSITION
  ========================================== */

  const isAtRight =
    gallery.scrollLeft +
    gallery.clientWidth >=
    gallery.scrollWidth - 5;


  /* ==========================================
     NO HORIZONTAL SCROLL
  ========================================== */

  if (
    !hasHorizontalScroll
  ) {

    button.classList.remove(
      "visible"
    );


    button.setAttribute(
      "aria-hidden",
      "true"
    );


    return;

  }


  /* ==========================================
     ALREADY AT RIGHT
  ========================================== */

  if (
    isAtRight
  ) {

    button.classList.remove(
      "visible"
    );


    button.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  /* ==========================================
     CAN SCROLL
  ========================================== */

  else {

    button.classList.add(
      "visible"
    );


    button.setAttribute(
      "aria-hidden",
      "false"
    );

  }

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


  image.alt =
    caption;


  if (captionElement) {

    captionElement.textContent =
      caption;

  }


  modal.classList.add(
    "active"
  );


  document.body.style.overflow =
    "hidden";

}


/* ============================================
   CLOSE LIGHTBOX
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


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "active"
  );


  document.body.style.overflow =
    "";


  setTimeout(
    function () {

      if (image) {

        image.src =
          "";

      }

    },
    250
  );

}


/* ============================================
   ESC KEY
============================================ */

document.addEventListener(
  "keydown",
  function (event) {

    if (
      event.key === "Escape"
    ) {

      closePhotoPreview();

      closeAllDropdowns();

    }

  }
);


/* ============================================
   DATE HELPERS
============================================ */

function getDateParts(
  dateString
) {

  const normalized =
    normalizeDate(
      dateString
    );


  const parts =
    normalized.split(
      "-"
    );


  return {

    year:
      Number(
        parts[0]
      ),

    month:
      Number(
        parts[1]
      ),

    day:
      Number(
        parts[2]
      )

  };

}


/* ============================================
   NORMALIZE DATE
============================================ */

function normalizeDate(
  dateString
) {

  if (!dateString) {
    return "";
  }


  const value =
    String(
      dateString
    ).trim();


  /* ==========================================
     YYYY-MM-DD
  ========================================== */

  const directMatch =
    value.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );


  if (directMatch) {

    return (

      directMatch[1] +

      "-" +

      String(
        directMatch[2]
      )
        .padStart(
          2,
          "0"
        ) +

      "-" +

      String(
        directMatch[3]
      )
        .padStart(
          2,
          "0"
        )

    );

  }


  /* ==========================================
     OTHER FORMATS
  ========================================== */

  const parsed =
    new Date(
      value
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return "";

  }


  return (

    parsed.getFullYear() +

    "-" +

    String(
      parsed.getMonth() + 1
    )
      .padStart(
        2,
        "0"
      ) +

    "-" +

    String(
      parsed.getDate()
    )
      .padStart(
        2,
        "0"
      )

  );

}


/* ============================================
   PARSE DATE
============================================ */

function parseDate(
  dateString
) {

  const parts =
    getDateParts(
      dateString
    );


  return new Date(
    parts.year,
    parts.month - 1,
    parts.day
  );

}


/* ============================================
   VALIDATE DATE
============================================ */

function isValidDateString(
  dateString
) {

  const normalized =
    normalizeDate(
      dateString
    );


  if (!normalized) {
    return false;
  }


  const parts =
    normalized.split(
      "-"
    );


  if (
    parts.length !== 3
  ) {

    return false;

  }


  const year =
    Number(
      parts[0]
    );


  const month =
    Number(
      parts[1]
    );


  const day =
    Number(
      parts[2]
    );


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  return (

    year >= 1900 &&

    month >= 1 &&

    month <= 12 &&

    day >= 1 &&

    day <= 31 &&

    date.getFullYear() ===
      year &&

    date.getMonth() ===
      month - 1 &&

    date.getDate() ===
      day

  );

}


/* ============================================
   MONTH NAME
============================================ */

function getMonthName(
  monthNumber
) {

  const months = [

    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember"

  ];


  return (

    months[
      monthNumber - 1
    ] || ""

  );

}


/* ============================================
   SHORT MONTH NAME
============================================ */

function getMonthShortName(
  monthNumber
) {

  const months = [

    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des"

  ];


  return (

    months[
      monthNumber - 1
    ] || ""

  );

}


/* ============================================
   DATE FILTER FORMAT
============================================ */

function formatDateFilter(
  dateString
) {

  const parts =
    getDateParts(
      dateString
    );


  const date =
    new Date(
      parts.year,
      parts.month - 1,
      parts.day
    );


  const weekdays = [

    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu"

  ];


  const weekday =
    weekdays[
      date.getDay()
    ];


  const day =
    String(
      parts.day
    )
      .padStart(
        2,
        "0"
      );


  return (

    weekday +
    " - " +
    day

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
   ESCAPE JAVASCRIPT
============================================ */

function escapeJS(
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
      /\\/g,
      "\\\\"
    )

    .replace(
      /'/g,
      "\\'"
    )

    .replace(
      /"/g,
      '\\"'
    )

    .replace(
      /\r/g,
      "\\r"
    )

    .replace(
      /\n/g,
      "\\n"
    );

}


/* ============================================
   ERROR
============================================ */

function showError(
  errorMessage = ""
) {

  const container =
    document.getElementById(
      "momentsTimeline"
    );


  if (!container) {
    return;
  }


  container.innerHTML = `

    <div class="error-state">

      <h2>
        Something went wrong
      </h2>

      <p>
        We couldn't load our moments.
      </p>

    </div>

  `;


  console.error(
    "Moments error:",
    errorMessage
  );

}