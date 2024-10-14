const express = require('express');
const request = require('request');
const instagramGetUrl = require('instagram-url-direct');
const ytdl = require('@distube/ytdl-core');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API endpoint for downloading videos
app.post('/download', async (req, res) => {
  const { url, quality } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (url.startsWith("https://www.instagram.com/")) {
    // Instagram download logic
    try {
      const response = await instagramGetUrl(url);
      const mediaUrl = response.url_list[0];

      const ext = mediaUrl.endsWith('.jpg') ? 'jpg' : 'mp4';
      downloadFile(res, mediaUrl, ext);
    } catch (error) {
      console.error("Error fetching Instagram data:", error);
      res.status(500).json({ error: 'Error fetching Instagram data' });
    }

  } else if (url.startsWith("https://www.youtube.com/") || url.startsWith("https://youtu.be/")) {
    // YouTube download logic for direct streaming
    try {
      res.header('Content-Disposition', 'attachment; filename="video.mp4"');
      ytdl(url, {
        quality: mapQuality(quality || 'highest'),
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
          }
        }
      }).pipe(res);  // Stream directly to the user
    } catch (error) {
      console.error("Error downloading YouTube video:", error);
      res.status(500).json({ error: 'Error downloading YouTube video' });
    }

  } else {
    res.status(400).json({ error: 'Invalid URL, only Instagram and YouTube URLs are supported' });
  }
});

// Function to download a file from Instagram
function downloadFile(res, url, ext) {
  request({ url, encoding: null }, (error, response, body) => {
    if (error || response.statusCode !== 200) {
      return res.status(400).json({ error: 'Error downloading file' });
    }

    const fileName = Date.now() + '.' + ext;
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(body);
  });
}

// Map quality to YouTube's formats
function mapQuality(quality) {
  switch (quality) {
    case '1080':
      return '137'; // 1080p video only
    case '720':
      return '136'; // 720p video only
    case '480':
      return '135'; // 480p video only
    case '360':
      return '134'; // 360p video only
    case 'highest':
    default:
      return 'highest';
  }
}

// Start the server
app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
