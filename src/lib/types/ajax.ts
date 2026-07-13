/**
 * Types for pixiv's web (touch) Ajax API.
 *
 * These are intentionally kept separate from the official App API types.  The
 * web API is not versioned and the same work is returned in a few slightly
 * different shapes (search cards, profile cards and detail pages).
 */

export interface AjaxApiResponse<TBody> {
  error: boolean;
  /** pixiv sends an empty string on successful responses. */
  message?: string;
  body: TBody;
}

export type AjaxDictionary<T> = Record<string, T | null>;
export type AjaxDictionaryOrArray<T> = AjaxDictionary<T> | T[];
export type AjaxNullableUrl = string | null;

export interface AjaxTitleCaptionTranslation {
  workTitle: string | null;
  workCaption: string | null;
}

export interface AjaxBookmarkData {
  id?: string | number;
  private?: boolean;
  [key: string]: unknown;
}

export interface AjaxIllustTag {
  tag: string;
  locked: boolean;
  deletable?: boolean;
  userId?: string;
  userName?: string;
}

export interface AjaxIllustTags {
  authorId?: string;
  isLocked?: boolean;
  writable?: boolean;
  tags: AjaxIllustTag[];
}

/** A work card returned by search, profile, recommendation and user/illusts. */
export interface AjaxIllustItem {
  id: string;
  title: string;
  url: string;
  userId: string;
  userName: string;
  pageCount: number;
  illustType: number;
  xRestrict: number;
  restrict?: number;
  sl?: number;
  aiType: number;
  alt: string;
  description?: string;
  tags: string[];
  profileImageUrl?: string;
  titleCaptionTranslation: AjaxTitleCaptionTranslation;
  width?: number;
  height?: number;
  createDate?: string;
  updateDate?: string;
  isBookmarkable?: boolean;
  bookmarkData?: AjaxBookmarkData | null;
  isMasked?: boolean;
  isOriginal?: boolean;
  isUnlisted?: boolean;
  visibilityScope?: number;
  /** Search responses currently use this snake-case spelling. */
  is_howto?: boolean;
  /** In-feed ad placeholders have a different, partial card shape. */
  isAdContainer?: boolean;
}

export interface AjaxNovelCover {
  urls: {
    "240mw"?: string;
    "480mw"?: string;
    "1200x1200"?: string;
    "128x128"?: string;
    original?: string;
  };
}

/** A novel card returned by search/profile/user/novels. */
export interface AjaxNovelItem {
  id: string;
  title: string;
  userId: string;
  userName: string;
  wordCount: number;
  readingTime: number;
  xRestrict: number;
  aiType: number;
  profileImageUrl: string;
  url?: string | null;
  cover?: AjaxNovelCover;
  description?: string;
  genre?: string;
  tags?: string[];
  textCount?: number;
  bookmarkCount?: number;
  bookmarkData?: AjaxBookmarkData | null;
  createDate?: string;
  updateDate?: string;
  isBookmarkable?: boolean;
  isMasked?: boolean;
  isOriginal?: boolean;
  isUnlisted?: boolean;
  language?: string;
  restrict?: number;
  visibilityScope?: number;
  useWordCount?: boolean;
  titleCaptionTranslation?: AjaxTitleCaptionTranslation;
  seriesId?: string | null;
  seriesTitle?: string | null;
  seriesContentOrder?: number | null;
}

export interface AjaxSearchMeta {
  alternateLanguages?: Record<string, string>;
  canonical?: string;
  description?: string;
  descriptionHeader?: string;
  title?: string;
}

export interface AjaxSearchWorkBucket<T> {
  data: T[];
  total: number;
  lastPage: number;
  bookmarkRanges?: Array<{ min: number | null; max: number | null }>;
}

export interface AjaxSearchAuxiliaryBody {
  extraData?: { meta?: AjaxSearchMeta };
  popular?: {
    permanent: AjaxIllustItem[];
    recent: AjaxIllustItem[];
  };
  relatedTags?: string[];
  suggestChips?: unknown[];
  tagTranslation?: unknown[];
  zoneConfig?: AjaxZoneConfig;
}

export interface AjaxSearchArtworksResponse extends AjaxApiResponse<
  AjaxSearchAuxiliaryBody & { illustManga: AjaxSearchWorkBucket<AjaxIllustItem> }
> {}

export interface AjaxSearchIllustrationsResponse extends AjaxApiResponse<
  AjaxSearchAuxiliaryBody & { illust: AjaxSearchWorkBucket<AjaxIllustItem> }
> {}

export interface AjaxSearchMangaResponse extends AjaxApiResponse<
  AjaxSearchAuxiliaryBody & { manga: AjaxSearchWorkBucket<AjaxIllustItem> }
> {}

export interface AjaxSearchNovelsResponse extends AjaxApiResponse<
  AjaxSearchAuxiliaryBody & { novel: AjaxSearchWorkBucket<AjaxNovelItem> }
> {}

export interface AjaxSeriesAdjacentWork {
  id: string | number;
  title: string;
  order?: number;
}

export interface AjaxSeriesNavData {
  seriesType?: string;
  seriesId?: string | number;
  title?: string | null;
  isConcluded?: boolean;
  isReplaceable?: boolean;
  isWatched?: boolean;
  isNotifying?: boolean;
  order?: number;
  prev?: AjaxSeriesAdjacentWork | null;
  next?: AjaxSeriesAdjacentWork | null;
}

export interface AjaxZoneConfig {
  [key: string]: { url: string };
}

export interface AjaxIllustMeta {
  meta: {
    alternateLanguages?: unknown[] | Record<string, string>;
    canonical: string;
    description: string;
    descriptionHeader: string;
    title: string;
    ogp?: {
      description: string;
      image: string;
      title: string;
      type: string;
    };
    twitter?: {
      card: string;
      description: string;
      image: string;
      title: string;
    };
  };
}

export interface AjaxNoLoginData {
  breadcrumbs?: {
    current?: Record<string, string>;
    successor?: unknown[];
  };
  zengoIdWorks?: AjaxIllustItem[];
  zengoWorkData?: {
    nextWork?: AjaxSeriesAdjacentWork;
    prevWork?: AjaxSeriesAdjacentWork;
  };
}

export interface AjaxIllustDetailBody {
  /** Current canonical keys. */
  id: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  userAccount: string;
  pageCount: number;
  urls: {
    mini: AjaxNullableUrl;
    thumb: AjaxNullableUrl;
    small: AjaxNullableUrl;
    regular: AjaxNullableUrl;
    original: AjaxNullableUrl;
  };
  tags: AjaxIllustTags;
  seriesNavData: AjaxSeriesNavData | null;
  illustType: number;
  xRestrict: number;
  restrict: number;
  sl: number;
  aiType: number;
  alt: string;
  width: number;
  height: number;
  createDate: string;
  uploadDate: string;
  updateDate?: string;
  bookmarkCount: number;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  responseCount: number;
  imageResponseCount: number;
  commentOff: number;
  likeData: boolean;
  isBookmarkable: boolean;
  isOriginal: boolean;
  isUnlisted: boolean;
  isHowto: boolean;
  isLoginOnly: boolean;
  isCitableInCollection: boolean;
  locationMask: boolean;
  bookmarkData: AjaxBookmarkData | null;
  titleCaptionTranslation: AjaxTitleCaptionTranslation;
  /** Compatibility keys still sent by the web endpoint. */
  illustId?: string;
  illustTitle?: string;
  illustComment?: string;
  userIllusts?: AjaxDictionary<AjaxIllustItem>;
  noLoginData?: AjaxNoLoginData;
  extraData?: AjaxIllustMeta;
  contestBanners?: unknown[];
  contestData?: unknown;
  comicPromotion?: unknown;
  fanboxPromotion?: unknown;
  request?: unknown;
  pollData?: unknown;
  imageResponseData?: unknown[];
  imageResponseOutData?: unknown[];
  reuploadDate?: string | null;
  descriptionBoothId?: string | null;
  descriptionYoutubeId?: string | null;
  commissionLinkHidden?: boolean;
  zoneConfig?: AjaxZoneConfig;
}

export interface AjaxIllustDetailResponse extends AjaxApiResponse<AjaxIllustDetailBody> {}

export interface AjaxIllustPagesResponse extends AjaxApiResponse<Array<{
  urls: {
    thumb_mini: string;
    small: string;
    regular: string;
    original: string;
  };
  width: number;
  height: number;
}>> {}

export interface AjaxRecommendDetail {
  methods: string[];
  score: number;
  seedIllustIds: Array<string | number>;
  banditInfo: string;
  recommendListId: string;
}

export interface AjaxIllustRecommendInitResponse extends AjaxApiResponse<{
  illusts?: AjaxIllustItem[];
  nextIds?: string[];
  details?: AjaxDictionary<AjaxRecommendDetail>;
}> {}

export interface AjaxTextEmbeddedImage {
  novelImageId: string;
  sl: number | string;
  urls: {
    "240mw": string;
    "480mw": string;
    "1200x1200": string;
    "128x128": string;
    original: string;
  };
}

export type AjaxTextEmbeddedImages = Record<string, AjaxTextEmbeddedImage> | null;

export interface AjaxNovelDetailBody {
  id: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string;
  userId: string;
  userName: string;
  bookmarkCount: number;
  commentCount: number;
  likeCount: number;
  viewCount: number;
  markerCount: number;
  pageCount: number;
  characterCount: number;
  wordCount: number;
  readingTime: number;
  xRestrict: number;
  restrict: number;
  aiType: number;
  genre: string;
  language: string;
  createDate: string;
  uploadDate: string;
  tags: AjaxIllustTags;
  seriesNavData: AjaxSeriesNavData | null;
  suggestedSettings: {
    viewMode: number;
    themeBackground: number;
    themeSize: number | null;
    themeSpacing: number | null;
  };
  textEmbeddedImages: AjaxTextEmbeddedImages;
  userNovels: AjaxDictionary<AjaxNovelItem>;
  useWordCount: boolean;
  hasGlossary: boolean;
  isBungei: boolean;
  isOriginal: boolean;
  isUnlisted: boolean;
  isLoginOnly: boolean;
  isBookmarkable: boolean;
  isCitableInCollection: boolean;
  likeData: boolean;
  bookmarkData: AjaxBookmarkData | null;
  marker: unknown;
  commentOff: number;
  titleCaptionTranslation: AjaxTitleCaptionTranslation;
  noLoginData?: AjaxNoLoginData;
  extraData?: AjaxIllustMeta;
  contestBanners?: unknown[];
  contestData?: unknown;
  comicPromotion?: unknown;
  fanboxPromotion?: unknown;
  request?: unknown;
  pollData?: unknown;
  imageResponseCount?: number;
  imageResponseData?: unknown[];
  imageResponseOutData?: unknown[];
  descriptionBoothId?: string | null;
  descriptionYoutubeId?: string | null;
  zoneConfig?: AjaxZoneConfig;
}

export interface AjaxNovelDetailResponse extends AjaxApiResponse<AjaxNovelDetailBody> {}

export interface AjaxSocial {
  twitter?: { url?: string };
  [key: string]: unknown;
}

export interface AjaxPrivacyField {
  name: string | null;
  privacyLevel: string | null;
}

export interface AjaxUserResponse extends AjaxApiResponse<{
  userId: string;
  name: string;
  comment: string;
  commentHtml: string;
  image: string;
  imageBig: string;
  webpage: string | null;
  social: AjaxSocial | unknown[];
  age: AjaxPrivacyField;
  birthDay: AjaxPrivacyField;
  gender: AjaxPrivacyField;
  job: AjaxPrivacyField;
  region: AjaxPrivacyField;
  background: {
    color: string | null;
    isPrivate: boolean;
    repeat: string | null;
    url: string;
  };
  workspace: Record<string, string>;
  following: number;
  mypixivCount: number;
  premium: boolean;
  official: boolean;
  isFollowed: boolean;
  isBlocking: boolean;
  isMypixiv: boolean;
  followedBack: boolean;
  canSendMessage: boolean;
  partial: number;
  sketchLiveId: string | null;
  sketchLives: unknown[];
  commission: unknown;
  group: unknown;
  publisher?: boolean;
}> {}

export interface AjaxUserProfileTopResponse extends AjaxApiResponse<{
  illusts: AjaxDictionaryOrArray<AjaxIllustItem>;
  manga: AjaxDictionaryOrArray<AjaxIllustItem>;
  novels: AjaxDictionaryOrArray<AjaxNovelItem>;
  collections?: unknown[];
  extraData?: { meta?: AjaxSearchMeta & { ogp?: Record<string, string>; twitter?: Record<string, string> } };
  requestPlans?: unknown[];
  requestPostWorks?: { artworks: unknown[]; novels: unknown[] };
  zoneConfig?: AjaxZoneConfig;
}> {}

export interface AjaxNovelSeriesSummary {
  id: string;
  title: string;
  cover: AjaxNovelCover;
}

export interface AjaxUserProfileAllResponse extends AjaxApiResponse<{
  illusts: Record<string, unknown> | string[] | null;
  manga: Record<string, unknown> | string[] | null;
  novels: Record<string, unknown> | string[] | null;
  novelSeries: AjaxNovelSeriesSummary[] | null;
  mangaSeries?: unknown[];
  bookmarkCount?: {
    private: { illust: number; novel: number };
    public: { collection: number; illust: number; novel: number };
  };
  collectionIds?: unknown[];
  collections?: unknown[];
  pickup?: unknown[];
  request?: unknown;
  externalSiteWorksStatus?: Record<string, boolean>;
  shouldShowSensitiveNotice?: boolean;
}> {}

export interface AjaxUserIllustsByIdsResponse extends AjaxApiResponse<AjaxDictionary<AjaxIllustItem>> {}

export interface AjaxUserNovelsByIdsResponse extends AjaxApiResponse<
  AjaxDictionary<AjaxNovelItem>
> {}

export interface AjaxIllustSeriesSummary {
  id: string;
  userId: string;
  title: string;
  description: string;
  caption: string;
  total: number;
  content_order: number | null;
  url: string;
  coverImageSl: number;
  firstIllustId: string;
  latestIllustId: string;
  createDate: string;
  updateDate: string;
  watchCount: number | null;
  isWatched: boolean;
  isNotifying: boolean;
}

export interface AjaxIllustSeriesPageResponse extends AjaxApiResponse<{
  illustSeries: AjaxIllustSeriesSummary[];
  thumbnails: {
    illust: AjaxIllustItem[];
  };
  page: {
    series: Array<{ workId: string; order: number }>;
    isSetCover: boolean;
    seriesId: string;
    otherSeriesId: string | null;
    recentUpdatedWorkIds: string[];
    total: number;
    isWatched: boolean;
    isNotifying: boolean;
  };
  tagTranslation?: Record<string, unknown>;
  requests?: unknown[];
  users?: unknown[];
  extraData?: { meta?: AjaxSearchMeta };
  zoneConfig?: AjaxZoneConfig;
}> {}
