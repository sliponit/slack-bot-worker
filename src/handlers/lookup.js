import qs from 'qs';
import { constructGhIssueSlackMessage } from '../utils/slack';


const ghIssueRegex = /(?<owner>\w*)\/(?<repo>\w*)\#(?<issue_number>\d*)/;
const parseGhIssueString = text => {
  const match = text.match(ghIssueRegex);
  return match ? match.groups : null;
};

const fetchGitHubIssue = (owner, repo, issue_number) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issue_number}`;
  const headers = { 'User-Agent': 'simple-worker-slack-bot' };
  return fetch(url, { headers });
};


export default async request => {
  try {
    const body = await request.text();
    const params = qs.parse(body);
    const text = params['text'].trim();
    const { owner, repo, issue_number } = parseGhIssueString(text);

    const response = await fetchGitHubIssue(owner, repo, issue_number);
    const issue = await response.json();

    const blocks = constructGhIssueSlackMessage(issue, text);

    return new Response(
      JSON.stringify({
        blocks,
        response_type: 'in_channel',
      }),
      { headers: { 'Content-type': 'application/json' } }
    );
  } catch (err) {
    const errorText =
      'Uh-oh! We could not find the issue you provided. We can only find public issues in the following format: `owner/repo#issue_number`.';
    return new Response(errorText);
  }
};
