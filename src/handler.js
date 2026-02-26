exports.handler = async (event) => {
  console.log('Hello World');
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Schedule:', process.env.CRON_SCHEDULE);
  return { statusCode: 200, body: 'Hello World' };
};
