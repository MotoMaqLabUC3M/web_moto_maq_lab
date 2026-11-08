/**
 * videoShowcase.js
 * Handles the hero background video:
 * - Plays once on page load (muted autoplay, no endless loop).
 * - When the video ends, smoothly fades out to reveal the original static hero image.
 * - Displays a sleek "Replay video" button.
 * - Clicking "Replay" restarts the video (with audio unmuted upon user interaction).
 * - Pauses on scroll to save battery and performance.
 */
(function () {
    'use strict';

    function init() {
        const heroSection = document.getElementById('heroSection') || document.querySelector('.hero--video');
        const video       = document.getElementById('heroVideo');
        const soundBtn    = document.getElementById('heroSoundToggle');
        const replayBtn   = document.getElementById('heroReplayBtn');

        if (!video || !heroSection) return;

        const iconOff = soundBtn ? soundBtn.querySelector('.hero__sound-icon--off') : null;
        const iconOn  = soundBtn ? soundBtn.querySelector('.hero__sound-icon--on') : null;

        function updateSoundIcons() {
            if (!iconOff || !iconOn) return;
            if (video.muted) {
                iconOff.style.display = '';
                iconOn.style.display  = 'none';
            } else {
                iconOff.style.display = 'none';
                iconOn.style.display  = '';
            }
        }

        // --- Sound toggle button ---
        if (soundBtn) {
            soundBtn.addEventListener('click', function () {
                video.muted = !video.muted;
                updateSoundIcons();
            });
        }

        // --- Video ended event: transition to static hero image & show replay button ---
        function onVideoEnded() {
            heroSection.classList.add('is-ended');
            // Mute video so if it loops unexpectedly it won't play sound
            video.muted = true;
            updateSoundIcons();
        }

        video.addEventListener('ended', onVideoEnded);

        // --- Replay button click: restart video from start ---
        if (replayBtn) {
            replayBtn.addEventListener('click', function () {
                heroSection.classList.remove('is-ended');
                video.currentTime = 0;
                // Since user explicitly clicked to watch the video, enable audio
                video.muted = false;
                updateSoundIcons();
                var playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch(function () {
                        // Fallback if browser requires muted play
                        video.muted = true;
                        updateSoundIcons();
                        video.play().catch(function () {});
                    });
                }
            });
        }

        // --- Pause / resume on scroll (battery + performance) ---
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        // Only resume if the video hasn't ended yet
                        if (!heroSection.classList.contains('is-ended') && !video.ended) {
                            video.play().catch(function () {});
                        }
                    } else {
                        video.pause();
                        // Auto-mute when scrolling away
                        if (!video.muted) {
                            video.muted = true;
                            updateSoundIcons();
                        }
                    }
                });
            }, { threshold: 0.25 });

            observer.observe(video);
        }

        // Initial setup
        updateSoundIcons();

        // If autoplay fails on initial load, show static image and replay button gracefully
        var initialPlay = video.play();
        if (initialPlay !== undefined) {
            initialPlay.catch(function () {
                onVideoEnded();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
