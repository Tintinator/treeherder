import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-regular-svg-icons';
import { Row, Tooltip } from 'reactstrap';
import { bugzillaBugsApi } from '../helpers/url';
import { getData } from '../helpers/http';
import { parseAuthor } from '../helpers/revision';

import BugLinkify from './BugLinkify';
import Clipboard from './Clipboard';

export function AuthorInitials(props) {
  const str = props.author || '';
  const words = str.split(' ');
  const firstLetters = words
    .map((word) => word.replace(/[^A-Z]/gi, '')[0])
    .filter((firstLetter) => typeof firstLetter !== 'undefined');
  let initials = '';

  if (firstLetters.length === 1) {
    // eslint-disable-next-line prefer-destructuring
    initials = firstLetters[0];
  } else if (firstLetters.length > 1) {
    initials = firstLetters[0] + firstLetters[firstLetters.length - 1];
  }

  return (
    <span title={props.title} className="text-nowrap">
      <span className="text-secondary">
        <FontAwesomeIcon icon={faUser} />
      </span>
      <span className="ml-1 icon-superscript font-italic font-weight-bold text-secondary user-push-initials">
        {initials}
      </span>
    </span>
  );
}

AuthorInitials.propTypes = {
  author: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export class Revision extends React.PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      clipboardVisible: false,
      tooltipOpen: false,
      tooltipData: { data: {}, failureStatus: undefined },
    };
  }

  showClipboard = (show) => {
    this.setState({ clipboardVisible: show });
  };

  isBackout = (comment) => {
    return comment.search('Backed out') >= 0 || comment.search('Back out') >= 0;
  };

  toggle = async (comment) => {
    const bugComment = comment.split('(', ')');
    console.log(bugComment);
    const { data, failureStatus } = await getData(
      bugzillaBugsApi('bug', { id: 1447537 }),
    );
    this.setState({
      tooltipOpen: !this.state.tooltipOpen,
      tooltipData: { data, failureStatus },
    });
    console.log('comment??' + comment);
    console.log(data);
  };

  render() {
    const {
      revision: { comments, author, revision },
      repo,
    } = this.props;
    const comment = comments.split('\n')[0];
    const { clipboardVisible, tooltipOpen, tooltipData } = this.state;
    const { name, email } = parseAuthor(author);
    const commitRevision = revision;
    const commentColor = this.isBackout(comment)
      ? 'text-danger'
      : 'text-secondary';

    return (
      <Row
        className="revision flex-nowrap"
        onMouseEnter={() => this.showClipboard(true)}
        onMouseLeave={() => this.showClipboard(false)}
        data-testid="revision"
      >
        <span className="pr-1 text-nowrap">
          <Clipboard
            description="full hash"
            text={commitRevision}
            visible={clipboardVisible}
          />
          <a
            title={`Open revision ${commitRevision} on ${repo.url}`}
            href={repo.getRevisionHref(commitRevision)}
            className="text-monospace commit-sha"
          >
            {commitRevision.substring(0, 12)}
          </a>
        </span>
        <AuthorInitials title={`${name}: ${email}`} author={name} />
        <span
          className={`ml-2 revision-comment overflow-hidden text-nowrap ${commentColor}`}
          id="BugCommitMessage"
        >
          <em>
            <BugLinkify>{comment}</BugLinkify>
          </em>
        </span>
        <Tooltip
          placement="bottom"
          target="BugCommitMessage"
          isOpen={tooltipOpen}
          toggle={this.toggle(comment)}
        >
          {tooltipData.data.summary}
        </Tooltip>
      </Row>
    );
  }
}

Revision.propTypes = {
  revision: PropTypes.shape({
    comments: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    revision: PropTypes.string.isRequired,
  }).isRequired,
  repo: PropTypes.shape({
    url: PropTypes.string,
    revisionHrefPrefix: PropTypes.string,
  }).isRequired,
};
