// Package, release day and linked song for one campaign. Renders inside <dl className="rc-facts">.

import PropTypes from "prop-types";
import { formatPlainDate, localDate, packageName, targetsFor } from "../../pages/campaigns/packages";
import { artistNames, safeArtwork, spotifyUrl } from "../../pages/campaigns/spotifyTrack";

export default function CampaignPackageFacts({ campaign, now }) {
  const track = campaign.spotify_track;
  const art = safeArtwork(track);
  const link = spotifyUrl(track);
  const releaseDate = campaign.release_date;
  const passed = releaseDate && releaseDate < localDate(0, new Date(now));
  const targets = targetsFor(campaign.package, campaign.budget);

  return (
    <>
      {campaign.package && (
        <div><dt>Package</dt><dd>{packageName(campaign.package)}</dd></div>
      )}
      {targets.length > 0 && (
        <div><dt>Campaign targets</dt><dd>{targets.join(", ")}</dd></div>
      )}
      {releaseDate && (
        <div>
          <dt>Release date</dt>
          <dd>{formatPlainDate(releaseDate)}{passed && " (passed)"}</dd>
        </div>
      )}
      {campaign.reserve_release_spots && (
        <div>
          <dt>Release-day spots</dt>
          <dd>Requested by the artist. {passed ? "The release date has passed." : "Hold playlist spots for release day."}</dd>
        </div>
      )}
      {track && (
        <div>
          <dt>Song</dt>
          <dd className="rc-song">
            {art && <img src={art} alt="" width={44} height={44} />}
            <span>
              {[track.name, artistNames(track)].filter(Boolean).join(" · ")}
              {link && <> <a href={link} target="_blank" rel="noopener noreferrer">Open on Spotify</a></>}
            </span>
          </dd>
        </div>
      )}
    </>
  );
}

CampaignPackageFacts.propTypes = {
  campaign: PropTypes.object.isRequired,
  now: PropTypes.number.isRequired,
};
