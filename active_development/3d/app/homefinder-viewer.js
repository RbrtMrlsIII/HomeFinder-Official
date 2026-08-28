/*
 * HomeFinder integration layer for Sweet Home 3D JS Viewer 7.5.2.
 * Vendor runtime files are intentionally kept unchanged in ../viewer/...
 */
(function () {
  "use strict";

  var HOME_URL = "../../../../master/HomeFinder.sh3d";

  var LEVELS = ["Basement", "1st floor", "Roof", "2nd floor", "Attic"];
  // The canonical model now contains seven levels. Sweet Home 3D viewer level selection is name-based; duplicate names are retained because they are physical model names.
  var LEGACY_CAMERAS = ["Living room", "Exterior", "Corridor", "Bedroom #1", "Kitchen"];
  // Canonical HomeFinder H-series cameras embedded in master/HomeFinder.sh3d.
  // These are presentation-only; they never authorize routes or roles.
  var HF_CAMERAS = [
    "HF H-01 — hero",
    "HF H-02 — discovery",
    "HF H-03 — property-display",
    "HF H-04 — map",
    "HF H-05 — government-desk",
    "HF H-06 — mission",
    "HF H-07 — guide",
    "HF H-08 — safety",
    "HF H-09 — contact"
  ];
  var CAMERAS = HF_CAMERAS.concat(LEGACY_CAMERAS);

  function showError(err) {
    if (err === "No WebGL") {
      window.alert("HomeFinder 3D requires WebGL. Please use a browser with WebGL support enabled.");
      return;
    }

    console.error(err);
    var message = err && err.message ? err.constructor.name + ": " + err.message : String(err);
    window.alert("HomeFinder could not load the 3D home. " + message);
  }

  function makeProgressHandler(progressContainer, progressBar, progressLabel) {
    return function (part, info, percentage) {
      if (part === HomeRecorder.READING_HOME) {
        progressBar.value = percentage * 100;
      } else if (part === Node3D.READING_MODEL) {
        progressBar.value = 100 + percentage * 100;
        if (percentage === 1) {
          progressContainer.hidden = true;
        }
      }

      var cleanInfo = info ? info.substring(info.lastIndexOf("/") + 1) : "";
      progressLabel.textContent =
        (percentage ? Math.floor(percentage * 100) + "% " : "") +
        part +
        (cleanInfo ? " " + cleanInfo : "");
    };
  }

  function baseOptions() {
    return {
      roundsPerMinute: 0,
      navigationPanel: "none",
      level: "1st floor",
      selectableLevels: LEVELS,
      camera: "HF H-01 — hero",
      selectableCameras: CAMERAS,
      activateCameraSwitchKey: true
    };
  }

  window.HomeFinderViewer = {
    start: function (canvasId, progressContainerId, progressBarId, progressLabelId) {
      var progressContainer = document.getElementById(progressContainerId);
      var progressBar = document.getElementById(progressBarId);
      var progressLabel = document.getElementById(progressLabelId);
      var options = baseOptions();

      viewHome(
        canvasId,
        HOME_URL,
        showError,
        makeProgressHandler(progressContainer, progressBar, progressLabel),
        Object.assign(options, {
          aerialViewButtonId: "aerialView",
          virtualVisitButtonId: "virtualVisit",
          levelsAndCamerasListId: "levelsAndCameras"
        })
      );
    },

    openOverlay: function () {
      viewHomeInOverlay(HOME_URL, {
        roundsPerMinute: 0,
        widthByHeightRatio: 4 / 3,
        navigationPanel: "none",
        aerialViewButtonText: "Aerial view",
        virtualVisitButtonText: "Virtual visit",
        selectableLevels: LEVELS,
        selectableCameras: CAMERAS,
        activateCameraSwitchKey: true,
        readingHomeText: "Loading HomeFinder home",
        readingModelText: "Loading 3D models",
        noWebGLSupportError: "HomeFinder 3D requires WebGL support"
      });
    }
  };
})();
