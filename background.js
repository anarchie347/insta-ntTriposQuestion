const PP_BASE_URL = "https://www.cl.cam.ac.uk/teaching/exams/pastpapers/";
const SOL_BASE_URL = "https://www.cl.cam.ac.uk/teaching/exams/solutions/";

const MIN_YEAR = 2005;
const MAX_YEAR = 2025;
const PAPERS = [4, 5, 6, 7];

async function getValidTriposUrl() {
  let validUrl = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (!validUrl && attempts < maxAttempts) {
    attempts++;

    // Generate a random year and paper
    const randomYear =
      Math.floor(Math.random() * (MAX_YEAR - MIN_YEAR + 1)) + MIN_YEAR;
    const randomPaper = PAPERS[Math.floor(Math.random() * PAPERS.length)];
    const randomQuestion = Math.floor(Math.random() * 10 + 1);

    const testUrl = `${PP_BASE_URL}y${randomYear}p${randomPaper}q${randomQuestion}.pdf`;

    try {
      // Fetch only the headers to save bandwidth and check if the file exists
      const response = await fetch(testUrl, { method: "HEAD" });
      if (response.ok && response.status === 200) {
        validUrl = testUrl;
        console.log(`Valid paper found on attempt ${attempts}: ${validUrl}`);
      }
    } catch (error) {
      console.error("Network error while checking URL:", error);
    }
  }

  // If we somehow fail 10 times (e.g., server down), fallback to a known paper
  return validUrl || `${PP_BASE_URL}y2023p4q1.pdf`;
}

// redirect
browser.webNavigation.onBeforeNavigate.addListener(
  async (details) => {
    const url = new URL(details.url);

    if (url.hostname.includes("instagram.com")) {
      const link = await getValidTriposUrl();
      browser.tabs.update(details.tabId, { url: link });
    }
  },
  { url: [{ hostContains: "instagram.com" }] },
);

// Swap between answers and question
browser.action.onClicked.addListener((tab) => {
  const currentUrl = tab.url;
  // past paper in form:
  // https://www.cl.cam.ac.uk/teaching/exams/pastpapers/yYYYYpPqQ.pdf
  // ans in form
  // https://www.cl.cam.ac.uk/teaching/exams/solutions/YYYY/YYYY-pPP-qQQ-solutions.pdf

  let newURL = "";

  if (currentUrl.startsWith(PP_BASE_URL)) {
    // PPQ -> SOLN
    const bySlash = currentUrl.split("/");
    const toParse = bySlash[6];
    const year = toParse.substring(1, 5).padStart(4, 0);
    const paper = toParse.substring(6, toParse.indexOf("q")).padStart(2, 0);
    const question = toParse
      .substring(toParse.indexOf("q") + 1, toParse.indexOf("."))
      .padStart(2, 0);

    newURL = `${SOL_BASE_URL}${year}/${year}-p${paper}-q${question}-solutions.pdf`;
  }
  if (currentUrl.startsWith(SOL_BASE_URL)) {
    // SOLN -> PPQ
    const bySlash = currentUrl.split("/");
    const year = bySlash[6];
    const toParse = bySlash[7];
    const byDash = toParse.split("-");
    const paper = String(Number(byDash[1].substring(1)));
    const question = String(Number(byDash[2].substring(1)));

    newURL = `${PP_BASE_URL}y${year}p${paper}q${question}.pdf`;
  }
  console.log(newURL);

  if (newURL != "") {
    browser.tabs.update(tab.id, { url: newURL });
  }
});
