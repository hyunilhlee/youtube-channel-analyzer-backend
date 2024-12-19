const express = require('express');
const router = express.Router();

// 채널 분석
router.post('/', async (req, res) => {
  try {
    const { channelId, videos } = req.body;

    // 구독자 규모 분류
    const subscriberCount = videos[0].subscriberCount;
    const channelSize = classifyChannelSize(subscriberCount);

    // 조회수 성과 분석
    const viewsAnalysis = analyzeViews(videos, subscriberCount);

    // 상호작용 분석
    const engagementAnalysis = analyzeEngagement(videos);

    res.json({
      analysis: {
        channelSize,
        metrics: {
          views: viewsAnalysis,
          engagement: engagementAnalysis
        }
      }
    });
  } catch (error) {
    console.error('채널 분석 실패:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 구독자 규모 분류 함수
function classifyChannelSize(subscriberCount) {
  if (subscriberCount < 1000) return { category: '초기 채널', description: '성장 초기 단계' };
  if (subscriberCount < 10000) return { category: '소규모 채널', description: '성장 진행 중' };
  if (subscriberCount < 100000) return { category: '중소규모 채널', description: '안정적 성장 단계' };
  if (subscriberCount < 500000) return { category: '중대형 채널', description: '성숙 단계' };
  if (subscriberCount < 1000000) return { category: '대형 채널', description: '성공적 운영 중' };
  return { category: '메가 채널', description: '최상위 채널' };
}

// 조회수 분석 함수
function analyzeViews(videos, subscriberCount) {
  const viewCounts = videos.map(video => ({
    count: video.viewCount,
    weeks: getWeeksSinceUpload(video.publishedAt)
  }));

  const adjustedViews = viewCounts.map(v => v.count / Math.sqrt(v.weeks));
  const averageAdjustedViews = adjustedViews.reduce((a, b) => a + b, 0) / adjustedViews.length;
  const viewsPerSubscriber = averageAdjustedViews / subscriberCount;

  return {
    score: viewsPerSubscriber,
    grade: getGrade(viewsPerSubscriber),
    description: getViewsDescription(viewsPerSubscriber)
  };
}

// 상호작용 분석 함수
function analyzeEngagement(videos) {
  const engagementRates = videos.map(video => {
    const total = video.likeCount + video.commentCount;
    return total / video.viewCount;
  });

  const averageEngagement = engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length;

  return {
    score: averageEngagement,
    grade: getGrade(averageEngagement),
    description: getEngagementDescription(averageEngagement)
  };
}

// 유틸리티 함수들
function getWeeksSinceUpload(publishedAt) {
  const weeks = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 7);
  return Math.max(1, weeks);
}

function getGrade(score) {
  if (score > 0.8) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
}

function getViewsDescription(score) {
  if (score > 0.8) return '매우 좋은 조회수 성과';
  if (score > 0.4) return '평균적인 조회수 성과';
  return '개선이 필요한 조회수 성과';
}

function getEngagementDescription(score) {
  if (score > 0.8) return '매우 높은 시청자 참여도';
  if (score > 0.4) return '평균적인 시청자 참여도';
  return '시청자 참여 유도 필요';
}

module.exports = router; 