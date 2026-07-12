import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { Suspense, lazy } from "solid-js";
import { Header } from "./components/Header";
import { OfflineNotice } from "./components/OfflineNotice";
import { registerServiceWorker } from "./lib/register-sw";
import "./style.css";

registerServiceWorker();

const Home = lazy(() => import("./routes/index"));
const Setting = lazy(() => import("./routes/setting"));
const History = lazy(() => import("./routes/history"));
const Bookmarks = lazy(() => import("./routes/bookmarks"));
const ArtworkDetail = lazy(() => import("./routes/artworks/[id]"));
const NovelDetail = lazy(() => import("./routes/novel/[id]"));
const SearchIllust = lazy(() => import("./routes/search/i"));
const SearchManga = lazy(() => import("./routes/search/m"));
const SearchNovel = lazy(() => import("./routes/search/n"));
const UserProfile = lazy(() => import("./routes/users/[id]/index"));
const UserIllusts = lazy(() => import("./routes/users/[id]/illusts"));
const UserManga = lazy(() => import("./routes/users/[id]/manga"));
const UserNovels = lazy(() => import("./routes/users/[id]/novels"));
const SeriesDetail = lazy(() => import("./routes/users/[id]/series/[seriesid]"));

function NotFound() {
  return <h1>Sorry, Not Found...</h1>;
}

function App() {
  return (
    <Router root={(props) => (
      <>
        <Header />
        <Suspense fallback={<p>読み込み中...</p>}>
          {props.children}
        </Suspense>
        <OfflineNotice />
      </>
    )}>
      <Route path="/" component={Home} />
      <Route path="/setting" component={Setting} />
      <Route path="/history" component={History} />
      <Route path="/bookmarks" component={Bookmarks} />
      <Route path="/artworks/:id" component={ArtworkDetail} />
      <Route path="/novel/:id" component={NovelDetail} />
      <Route path="/search/i" component={SearchIllust} />
      <Route path="/search/m" component={SearchManga} />
      <Route path="/search/n" component={SearchNovel} />
      <Route path="/users/:id/illusts" component={UserIllusts} />
      <Route path="/users/:id/manga" component={UserManga} />
      <Route path="/users/:id/novels" component={UserNovels} />
      <Route path="/users/:id/series/:seriesid" component={SeriesDetail} />
      <Route path="/users/:id" component={UserProfile} />
      <Route path="*splat" component={NotFound} />
    </Router>
  );
}

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
