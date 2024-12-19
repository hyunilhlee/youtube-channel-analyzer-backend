const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// 채널 ID 추출 함수
const extractChannelId = async (url) => {
  try {
    let channelId;
    
    // URL에서 채널 정보 추출
    if (url.includes('/watch?v=')) {
      // 비디오 URL인 경우 비디오 정보에서 채널 ID 추출
      const videoId = url.split('v=')[1].split('&')[0];
      console.log('추출된 비디오 ID:', videoId);
      
      const videoResponse = await youtube.videos.list({
        part: 'snippet',
        id: videoId
      });

      if (videoResponse.data.items && videoResponse.data.items.length > 0) {
        channelId = videoResponse.data.items[0].snippet.channelId;
        console.log('비디오에서 추출한 채널 ID:', channelId);
      }
    } else if (url.includes('@')) {
      // @username 형식의 URL 처리
      const handleMatch = url.match(/@([^/]+)/);
      if (handleMatch) {
        const handle = handleMatch[1];
        console.log('추출된 채널 핸들:', handle);

        // 채널 검색
        const searchResponse = await youtube.search.list({
          part: 'snippet',
          q: `@${handle}`,
          type: 'channel',
          maxResults: 1
        });

        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
          channelId = searchResponse.data.items[0].snippet.channelId;
          console.log('검색으로 찾은 채널 ID:', channelId);
        }
      }
    }

    if (!channelId) {
      throw new Error('채널 정보를 찾을 수 없습니다.');
    }

    return channelId;
  } catch (error) {
    console.error('채널 ID 추출 실패:', error);
    throw new Error('채널 정보를 찾을 수 없습니다.');
  }
};

// 채널 정보 조회
router.get('/', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: '채널 URL이 필요합니다.' });
    }

    console.log('요청된 URL:', url);

    // 채널 ID 추출
    const channelId = await extractChannelId(url);
    console.log('추출된 채널 ID:', channelId);

    // 채널 정보 조회
    const channelResponse = await youtube.channels.list({
      part: 'snippet,statistics,contentDetails,brandingSettings',
      id: channelId
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).json({ error: '채널을 찾을 수 없습니다.' });
    }

    const channelInfo = channelResponse.data.items[0];
    console.log('채널 정보:', {
      title: channelInfo.snippet.title,
      subscriberCount: channelInfo.statistics.subscriberCount,
      viewCount: channelInfo.statistics.viewCount
    });

    // 최근 영상 목록 조회
    const playlistId = channelInfo.contentDetails.relatedPlaylists.uploads;
    console.log('업로드 재생목록 ID:', playlistId);

    const playlistResponse = await youtube.playlistItems.list({
      part: 'snippet,contentDetails',
      playlistId: playlistId,
      maxResults: 5
    });

    if (!playlistResponse.data.items) {
      throw new Error('영상 목록을 가져올 수 없습니다.');
    }

    // 영상 상세 정보 조회
    const videoIds = playlistResponse.data.items.map(item => item.contentDetails.videoId);
    console.log('가져올 비디오 ID들:', videoIds);

    const videoDetailsResponse = await youtube.videos.list({
      part: 'statistics,snippet',
      id: videoIds.join(',')
    });

    if (!videoDetailsResponse.data.items) {
      throw new Error('영상 상세 정보를 가져올 수 없습니다.');
    }

    console.log('비디오 상세 정보 샘플:', videoDetailsResponse.data.items[0].statistics);

    const recentVideos = videoDetailsResponse.data.items.map(video => {
      const viewCount = parseInt(video.statistics.viewCount || '0');
      const likeCount = parseInt(video.statistics.likeCount || '0');
      const commentCount = parseInt(video.statistics.commentCount || '0');
      
      const videoInfo = {
        title: video.snippet.title,
        publishedAt: new Date(video.snippet.publishedAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        url: `https://www.youtube.com/watch?v=${video.id}`,
        thumbnail: video.snippet.thumbnails.medium.url,
        statistics: {
          viewCount: viewCount.toLocaleString('ko-KR'),
          likeCount: likeCount.toLocaleString('ko-KR'),
          commentCount: commentCount.toLocaleString('ko-KR')
        }
      };
      console.log('비디오 정보:', videoInfo);
      return videoInfo;
    });

    // 구독자 수 처리
    const subscriberCount = parseInt(channelInfo.statistics.subscriberCount || '0');
    console.log('최종 구독자 수:', subscriberCount.toLocaleString('ko-KR'));

    const response = {
      channelId: channelInfo.snippet.customUrl || channelId,
      title: channelInfo.snippet.title,
      subscriberCount: subscriberCount.toLocaleString('ko-KR'),
      recentVideos
    };

    console.log('최종 응답:', JSON.stringify(response, null, 2));
    res.json(response);

  } catch (error) {
    console.error('채널 정보 조회 실패:', error);
    res.status(500).json({ error: error.message || '서버 오류가 발생했습니다.' });
  }
});

module.exports = router; 