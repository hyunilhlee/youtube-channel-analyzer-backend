const request = require('supertest');
const app = require('../app');

describe('Channel API Tests', () => {
  test('GET /api/channel - should validate channel URL', async () => {
    const response = await request(app)
      .get('/api/channel')
      .query({ url: 'https://www.youtube.com/invalid' });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  test('POST /api/analyze - should analyze channel data', async () => {
    const mockChannelData = {
      channelId: 'test-channel',
      videos: [
        {
          id: 'video1',
          viewCount: 1000,
          likeCount: 100,
          commentCount: 50,
          publishedAt: new Date().toISOString()
        }
      ]
    };

    const response = await request(app)
      .post('/api/analyze')
      .send(mockChannelData);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('analysis');
  });
}); 