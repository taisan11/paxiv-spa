export interface AjaxApiResponse<TBody> {
  error: boolean;
  message?: string;
  body: TBody;
}

export type AjaxDictionary<T> = Record<string, T | null>;
export type AjaxDictionaryOrArray<T> = AjaxDictionary<T> | T[];

export interface AjaxTitleCaptionTranslation {
  workTitle: string | null;
  workCaption: string | null;
}

export interface AjaxIllustItem {
  id: string;
  title: string;
  url: string;
  userId: string;
  userName: string;
  pageCount: number;
  illustType: number;
  xRestrict: number;
  aiType: number;
  alt: string;
  tags: string[];
  profileImageUrl: string;
  titleCaptionTranslation: AjaxTitleCaptionTranslation;
}

export interface AjaxNovelCover {
  urls: {
    "240mw": string;
    "480mw": string;
    "1200x1200": string;
    "128x128": string;
    original: string;
  };
}

export interface AjaxNovelItem {
  id: string;
  title: string;
  userId: string;
  userName: string;
  wordCount: number;
  readingTime: number;
  xRestrict: number;
  aiType: number;
  cover?: AjaxNovelCover;
  url?: string | null;
  profileImageUrl: string;
}

export interface AjaxSearchArtworksResponse extends AjaxApiResponse<{
  illustManga: {
    data: AjaxIllustItem[];
    total: number;
    lastPage: number;
  };
}> {}

export interface AjaxSearchMangaResponse extends AjaxApiResponse<{
  manga: {
    data: AjaxIllustItem[];
    total: number;
    lastPage: number;
  };
}> {}

export interface AjaxSearchNovelsResponse extends AjaxApiResponse<{
  novel: {
    data: AjaxNovelItem[];
    total: number;
    lastPage: number;
  };
}> {}

export interface AjaxIllustDetailResponse extends AjaxApiResponse<{
  id: string;
  title: string;
  description: string;
  userId: string;
  userName: string;
  pageCount: number;
  urls: {
    mini: string;
    thumb: string;
    small: string;
    regular: string;
    original: string;
  };
  tags: {
    tags: {
      tag: string;
      locked: boolean;
      deletable: boolean;
      userId: string;
      userName: string;
    }[];
  };
  seriesNavData: {
    seriesId?: string | number;
    title?: string | null;
    prev?: { id: string | number; title: string } | null;
    next?: { id: string | number; title: string } | null;
  } | null;
}> {}

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

export interface AjaxIllustRecommendInitResponse extends AjaxApiResponse<{
  illusts?: AjaxIllustItem[];
  nextIds?: string[];
  details?: unknown;
}> {}

export interface AjaxNovelDetailResponse extends AjaxApiResponse<{
  id: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string;
  userId: string;
  userName: string;
  seriesNavData: {
    seriesId?: string | number;
    title?: string | null;
    prev?: { id: string | number; title: string } | null;
    next?: { id: string | number; title: string } | null;
  } | null;
}> {}

export interface AjaxUserResponse extends AjaxApiResponse<{
  userId: string;
  name: string;
  commentHtml: string;
  image: string;
  imageBig: string;
  webpage: string | null;
  social:
    | {
        twitter?: {
          url?: string;
        };
      }
    | unknown[];
}> {}

export interface AjaxUserProfileTopResponse extends AjaxApiResponse<{
  illusts: AjaxDictionaryOrArray<AjaxIllustItem>;
  manga: AjaxDictionaryOrArray<AjaxIllustItem>;
  novels: AjaxDictionaryOrArray<AjaxNovelItem>;
}> {}

export interface AjaxUserProfileAllResponse extends AjaxApiResponse<{
  illusts: Record<string, unknown> | string[];
  manga: Record<string, unknown> | string[];
  novels: Record<string, unknown> | string[];
  novelSeries: AjaxNovelSeriesSummary[];
}> {}

export interface AjaxUserIllustsByIdsResponse extends AjaxApiResponse<AjaxDictionary<AjaxIllustItem>> {}

export interface AjaxUserNovelsByIdsResponse extends AjaxApiResponse<
  AjaxDictionary<
    AjaxNovelItem & {
      url?: string | null;
      seriesId?: string | null;
      seriesTitle?: string | null;
      seriesContentOrder?: number | null;
    }
  >
> {}

export interface AjaxNovelSeriesSummary {
  id: string;
  title: string;
  cover: AjaxNovelCover;
}

export interface AjaxIllustSeriesDetailResponse extends AjaxApiResponse<{
  series: {
    id: string;
    title: string;
    total: number | string;
  };
}> {}

export interface AjaxIllustSeriesContentItem {
  id: string;
  title: string;
  url: string;
}

export interface AjaxIllustSeriesContentResponse extends AjaxApiResponse<{
  series_contents?: AjaxIllustSeriesContentItem[];
  thumbnails?: {
    illust?: AjaxIllustSeriesContentItem[];
  };
}> {}
