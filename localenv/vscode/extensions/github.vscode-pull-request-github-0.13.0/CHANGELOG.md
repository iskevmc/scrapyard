0.13.0

We saw a huge amount of community participation this release, thank you so much to everyone who contributed!

**Changes**
- Option to view changed files in a tree instead of a list [653](https://github.com/microsoft/vscode-pull-request-github/issues/653) by @yulrizka
- Allow choosing title when creating pull request [906](https://github.com/microsoft/vscode-pull-request-github/issues/906) by @nminchow
- Add context menu actions to open original/modified file [35](https://github.com/microsoft/vscode-pull-request-github/issues/35) by @anoadragon453 and @Tunous
- Add pending label to comments of pending reviews on timeline [1369](https://github.com/microsoft/vscode-pull-request-github/issues/1369) by @akosasante
- Support images in tree diff views [1356](https://github.com/microsoft/vscode-pull-request-github/issues/1356)
- When file change patch is empty, directly fetch the file contents instead of showing notification to open on GitHub [305](https://github.com/microsoft/vscode-pull-request-github/issues/305)
- Add a quote reply action for comments on the description page [1396](https://github.com/microsoft/vscode-pull-request-github/issues/1396) by @shaodahong
- Clicking status bar item brings up configuration actions [360](https://github.com/microsoft/vscode-pull-request-github/issues/360)

**Bug fixes**
- Sign-out picker: do not close on focus lost [1348](https://github.com/microsoft/vscode-pull-request-github/issues/1348)
- Align "Request Changes" and "Approve" by comment [297](https://github.com/microsoft/vscode-pull-request-github/issues/297) by @guilherme-gm
- Align commit hash in PR description and avoid breaking username on hyphen [1353](https://github.com/microsoft/vscode-pull-request-github/issues/1353) by @JeffreyCA
- Show "Successfully signed in" in status bar after login instead of notification [1347](https://github.com/microsoft/vscode-pull-request-github/issues/1347) by @JeffreyCA
- Check status bar item exists before setting text [1251](https://github.com/microsoft/vscode-pull-request-github/issues/1251)
- Add confirmation dialog to delete review [1364](https://github.com/microsoft/vscode-pull-request-github/issues/1364)
- Address @octokit/rest deprecation warnings [1367](https://github.com/microsoft/vscode-pull-request-github/issues/1367)
- Correctly handle undefined path for empty files [1372](https://github.com/microsoft/vscode-pull-request-github/issues/1372)
- Fetch branch prior to checking if its behind remote [1368](https://github.com/microsoft/vscode-pull-request-github/issues/1368)
- Use path relative to the git repo instead of workspace [1374](https://github.com/microsoft/vscode-pull-request-github/issues/1374)
- Editing comment on description page does not immediately update text [1383](https://github.com/microsoft/vscode-pull-request-github/issues/1383)
- Cancel edit reverts to the wrong value of comment when re-editing [1157](https://github.com/microsoft/vscode-pull-request-github/issues/1157)
- Fix commenting ranges for deleted files [1384](https://github.com/microsoft/vscode-pull-request-github/issues/1384)
- Fix description page styling when reloading on high contrast theme [897](https://github.com/microsoft/vscode-pull-request-github/issues/897)
- Make comment drag handle transparent [1361](https://github.com/microsoft/vscode-pull-request-github/issues/1361) by @JeffreyCA
- Fix failure to detect remote is github when it has www subdomain [903](https://github.com/microsoft/vscode-pull-request-github/issues/903)
- Prevent Checkout/Refresh being selected on description page [628](https://github.com/microsoft/vscode-pull-request-github/issues/628)
- Prevent double selection when using secondary actions in the tree [1270](https://github.com/microsoft/vscode-pull-request-github/issues/1270)
- Preserve expansion state of tree view items on checkout [1392](https://github.com/microsoft/vscode-pull-request-github/issues/1392)
- Fix TypeError "Cannot read property 'comments' of undefined" while loading description page [1307](https://github.com/microsoft/vscode-pull-request-github/issues/1307)
- Prevent links from overflowing the description area [806](https://github.com/microsoft/vscode-pull-request-github/issues/806) by @lifez
- Ensure tree decorations are updated as comments change [664](https://github.com/microsoft/vscode-pull-request-github/issues/664)
- Support permanently ignoring sign in notification [1389](https://github.com/microsoft/vscode-pull-request-github/issues/1389)
- Show PR actions only to users with push access [967](https://github.com/microsoft/vscode-pull-request-github/issues/967) by @IllusionMH
- Preserve tree state on reload [1036](https://github.com/microsoft/vscode-pull-request-github/issues/1036) and [1409](https://github.com/microsoft/vscode-pull-request-github/issues/1409)
- Use `asWebviewUri` API to get webview script URI by @IllusionMH
- Remove useless conditional in preview header by @emtei
- Fix for displaying invalid pull request messages by @emtei
- Disable selection line numbers in diffs on the description page [354](https://github.com/microsoft/vscode-pull-request-github/issues/354)
- Better support for merging when in dirty state [1405](https://github.com/microsoft/vscode-pull-request-github/issues/1405)
- Explain self assignment in pullRequestNode [1421](https://github.com/microsoft/vscode-pull-request-github/issues/1421) by @emtei
- Add back "Outdated" label to comments on description page [1407](https://github.com/microsoft/vscode-pull-request-github/issues/1407)
- Fix invalid graphql url for github enterprise [1381](https://github.com/microsoft/vscode-pull-request-github/issues/1381) by @yulrizka
- Display "pending" mergeability state on description page and poll for updates [1412](https://github.com/microsoft/vscode-pull-request-github/issues/1412)
- When assigning reviewers, limit list to assignable users and improve ordering [1424](https://github.com/microsoft/vscode-pull-request-github/issues/1424) by @IllusionMH
- Improve visibility of PR controls to take into account user write permissions [1408](https://github.com/microsoft/vscode-pull-request-github/issues/1408) and [1065](https://github.com/microsoft/vscode-pull-request-github/issues/1065) by @IllusionMH

0.12.0
- Adopt `createAppUri` API in authentication flow [1354](https://github.com/microsoft/vscode-pull-request-github/pull/1345)

0.11.2

**Bug fixes**
- Comments sometimes duplicated on diff files from pull request tree [#1337](https://github.com/microsoft/vscode-pull-request-github/issues/1337)

0.11.1

***Bug fixes***
- Pull request tree incorrectly shows 'No git repositories found' [#1334](https://github.com/microsoft/vscode-pull-request-github/issues/1334)

0.11.0

***Changes***
- Add support for deleting a PR after close or merge [#350](https://github.com/microsoft/vscode-pull-request-github/issues/350)
- Update GraphQL timeline event query
- Update dependencies

***Bug fixes***
- Fix formatting of GitHub errors [#1298](https://github.com/microsoft/vscode-pull-request-github/issues/1298)
- Show error when user doesn't have permission to push to remote [#1299](https://github.com/microsoft/vscode-pull-request-github/issues/1299)
- Remove usage of rootPath and fix suggested edits [#1312](https://github.com/microsoft/vscode-pull-request-github/issues/1312)
- Disable 'Checkout' and 'Exit Review Mode' buttons while actions are in progress [#1312](https://github.com/microsoft/vscode-pull-request-github/issues/1312)
- Calculate unique branch name for PRs from forks [#1294](https://github.com/microsoft/vscode-pull-request-github/issues/1294)
- Fix 'Error: No matching file found' problem when adding comments [#1308](https://github.com/microsoft/vscode-pull-request-github/issues/1308)
- Initialize extension with repository that is currently selected in the source control view [#1330](https://github.com/microsoft/vscode-pull-request-github/issues/1330)
- Handle error on unshallow [#1328](https://github.com/microsoft/vscode-pull-request-github/issues/1328)

0.10.0

***Changes***
- Use pull request template when creating PR [#798](https://github.com/microsoft/vscode-pull-request-github/issues/798)
- Improvements to pull request tree display message when loading or not signed in (#1269)(https://github.com/microsoft/vscode-pull-request-github/issues/1269)
- Change telemetry library to application insights [#1264)(https://github.com/microsoft/vscode-pull-request-github/issues/1264)
- Update icons to match new VSCode icon style (#1261)(https://github.com/microsoft/vscode-pull-request-github/issues/1261)
- Update dependencies

***Bug fixes***
- Set a default array for `githubPullRequests.remotes` [#1289](https://github.com/microsoft/vscode-pull-request-github/issues/1289)
- Fix spacing between textbox and buttons on description page [#1287](https://github.com/microsoft/vscode-pull-request-github/issues/1287)
- Fix updates to comment thread cache when creating the first comment in a thread [#1282](https://github.com/microsoft/vscode-pull-request-github/pull/1282)
- Fix updates to outdated comments (#1279)[https://github.com/microsoft/vscode-pull-request-github/issues/1279]
- Ensure comment commands are limited to GitHub Pull Request comment widgets [#1277](https://github.com/microsoft/vscode-pull-request-github/issues/1277)
- Fix error when trying to add reviewers on description page [#1181](https://github.com/microsoft/vscode-pull-request-github/issues/1181)
- Enable removing a label on description page [#1258](https://github.com/microsoft/vscode-pull-request-github/issues/1258)

***Thank You***
- Description view of PR: make whole commit line clickable [#1259](https://github.com/microsoft/vscode-pull-request-github/issues/1259) by @tobudim
- Sort description view labels case sensitively [#1008](https://github.com/microsoft/vscode-pull-request-github/issues/1008) by @haryps

0.9.0

**Changes**
- Adopt new commenting api [#1168](https://github.com/microsoft/vscode-pull-request-github/issues/1168)
- Set tree selection on tree node when clicking on an inline action [1245](https://github.com/microsoft/vscode-pull-request-github/issues/1245)

**Bug fixes**
- Command palette sign in not working [#1213](https://github.com/microsoft/vscode-pull-request-github/issues/1213)
- Limit comment areas on the base side of diff editors to deleted lines [#153](https://github.com/microsoft/vscode-pull-request-github/issues/153)
- Ensure extension activates when ssh config contains "Host *+*" [#1255](https://github.com/microsoft/vscode-pull-request-github/issues/1255)
- Update wording of sign in notification [#757](https://github.com/microsoft/vscode-pull-request-github/issues/757)
- Address @octokit/rest deprecations [#1227](https://github.com/microsoft/vscode-pull-request-github/issues/1255)

0.8.0

**Changes**
- Add Draft PR support [#1129](https://github.com/microsoft/vscode-pull-request-github/issues/1129)
- Support specifying custom category in PR tree view  [#1106](https://github.com/microsoft/vscode-pull-request-github/issues/1106)

**Bug fixes**
- Do not show commands before extension has fully activated [#1198](https://github.com/microsoft/vscode-pull-request-github/issues/1198)
- Description page is blank after 0.7.0 upgrade [#1175](https://github.com/microsoft/vscode-pull-request-github/issues/1175)
- Change "wants to merge" text when viewing merged PR [#1027](https://github.com/microsoft/vscode-pull-request-github/issues/1027)
- Correct text alignment in merged timeline events [#1199](https://github.com/microsoft/vscode-pull-request-github/issues/1199)
- Update UI after adding reviewers or labels [#1191](https://github.com/microsoft/vscode-pull-request-github/issues/1191)
- Update PR details after merge [#1183](https://github.com/microsoft/vscode-pull-request-github/issues/1183)
- Display a message before opening file diffs in the browser [#442](https://github.com/microsoft/vscode-pull-request-github/issues/442), thank you [@malwilley](https://github.com/malwilley)!
- Swap order of PR branch and target branch [#784](https://github.com/microsoft/vscode-pull-request-github/issues/784)


0.7.0

**Engineering**
- Description view is now rendered with React [#1096](https://github.com/microsoft/vscode-pull-request-github/pull/1096)
- Performance improvement
  - [Decrease time to enter review mode](https://github.com/microsoft/vscode-pull-request-github/pull/1131)

**Bug fixes**
- Pull Request Tree GitHub Enterprise Avatars [#1121](https://github.com/microsoft/vscode-pull-request-github/pull/1121)
- Unable to expand PRs whose branch contains a # character [#1059](https://github.com/microsoft/vscode-pull-request-github/issues/1059)

0.6.1

**Bug fixes**
- Fix git onDidOpenRepository eventing [#1122](https://github.com/Microsoft/vscode-pull-request-github/pull/1122)

0.6.0

**Changes**
- Introduce new comment provider API [#972](https://github.com/Microsoft/vscode-pull-request-github/pull/972)
- Fix rendering of checkboxes on description page [#1038](https://github.com/Microsoft/vscode-pull-request-github/issues/1038)
- Fix [#1082](https://github.com/Microsoft/vscode-pull-request-github/issues/1082) to make sure commands are scoped to the correct tree
- Fix [#291](https://github.com/Microsoft/vscode-pull-request-github/issues/291) to use monospace font for code blocks on description page


0.5.1

**Changes**
- Fix description not displaying after creating a pull request [#1041](https://github.com/Microsoft/vscode-pull-request-github/pull/1041)

0.5.0

**Breaking Changes**

- From 0.5.0, you at least need VSCode 1.32 to install and run the extension.

**Changes**
- Add support for reacting to comments [#46](https://github.com/Microsoft/vscode-pull-request-github/issues/46)
- Display reviewers on the description page, and support adding and removing them [#412](https://github.com/Microsoft/vscode-pull-request-github/issues/412)
- Support adding and removing labels from the description page [#933](https://github.com/Microsoft/vscode-pull-request-github/issues/933)
- Fix [#936](https://github.com/Microsoft/vscode-pull-request-github/issues/936), pending review not correctly detected in "Changes in Pull Request" tree
- Fix [#929](https://github.com/Microsoft/vscode-pull-request-github/issues/929), description textarea not cleared when approving or requesting changes
- Fix [#912](https://github.com/Microsoft/vscode-pull-request-github/issues/912), approving the PR scrolls to the top of the page

**New settings**
- `githubPullRequests.showInSCM` can be used to configure where the `GitHub Pull Requests` tree is shown, either the new GitHub viewlet or
the SCM viewlet where it was before. By default, the tree is shown in the GitHub viewlet.

**Thank You**
- Disable not available merge methods [#946](https://github.com/Microsoft/vscode-pull-request-github/pull/946) by @IllusionMH
- Fix LGTM.com alerts [#948](https://github.com/Microsoft/vscode-pull-request-github/pull/948) by @samlanning

0.4.0

**Breaking Changes**

- From 0.4.0, you at least need VSCode 1.31 to install and run the extension.

**Changes**
- Display mergeability on PR description page [#773](https://github.com/Microsoft/vscode-pull-request-github/pull/773)
- Add an inline action to open the description to the side [#310](https://github.com/Microsoft/vscode-pull-request-github/issues/310)
- Add refresh button to the description page [#771](https://github.com/Microsoft/vscode-pull-request-github/pull/771)
- Improve performance of checkout by minimally fetching data and lazily loading [#796](https://github.com/Microsoft/vscode-pull-request-github/pull/796)
- Update the styling of the description page [#763](https://github.com/Microsoft/vscode-pull-request-github/pull/763)
- Support navigating to a file from the description page [#750](https://github.com/Microsoft/vscode-pull-request-github/pull/750)
- Linkify issue references on the description page [#566](https://github.com/Microsoft/vscode-pull-request-github/issues/566)
- Show user's role (collaborator, contributor, etc.) by comments on the description [#303](https://github.com/Microsoft/vscode-pull-request-github/issues/303)
- Support starting, deleting, and finishing a complete review [#546](https://github.com/Microsoft/vscode-pull-request-github/issues/546)
- Allow selecting the merge method on the description page [#826](https://github.com/Microsoft/vscode-pull-request-github/pull/826)
- Autocompletions for usernames within editor comments [#842](https://github.com/Microsoft/vscode-pull-request-github/pull/842)

As part of this release, we have begun adopting GitHub's GraphQL API in some places to support new features and improve performance. The reviews feature and linkifying of issue references depend on the GraphQL API. This API is not available for GitHub Enterprise, so please note that these features will not be available for those projects.

**New settings**
- `githubPullRequests.remotes` can be used to configure what remotes pull requests should be displayed from. By default, the extension will look for `upstream` and `origin` remotes
by convention and fetch from these, or will fetch from any other remotes if these are not present.
- `githubPullRequests.defaultMergeMethod` specifies which merge method (`merge`, `rebase`, or `squash`) to select by default, both on the description page and when using the `Merge Pull Request` command.
This is set to `merge` by default.

**Thank You**
* Fix log output [PR #804](https://github.com/Microsoft/vscode-pull-request-github/pull/804) by @Ikuyadeu
* Update setting description to use non deprecated key [PR #916](https://github.com/Microsoft/vscode-pull-request-github/pull/916) by @mkonikov

0.3.2
- Honor the new `git.openDiffOnClick` setting [#753](https://github.com/Microsoft/vscode-pull-request-github/pull/753)
- Prompt to stage all changes when running the suggest changes with nothing staged [#744](https://github.com/Microsoft/vscode-pull-request-github/pull/744)
- Add an inline "Open File" action in the "Changes in Pull Request" tree and match styling of git changes [#738](https://github.com/Microsoft/vscode-pull-request-github/pull/738)
- Display the full file path using the tree item's description, matching other views [#730](https://github.com/Microsoft/vscode-pull-request-github/issues/730)
- Parse auth callback state parameter on client side instead of mkaing a request to the auth server [#715](https://github.com/Microsoft/vscode-pull-request-github/pull/715)
- Fix [#735](https://github.com/Microsoft/vscode-pull-request-github/issues/735), ensure correct head parameter is used when creating PR
- Fix [#727](https://github.com/Microsoft/vscode-pull-request-github/issues/727), make sure review state is always cleared when switching branches
- Fix [#728](https://github.com/Microsoft/vscode-pull-request-github/issues/738), keep description page data up to date when updating title and description

0.3.1
- Add status check information on PR description page [#713](https://github.com/Microsoft/vscode-pull-request-github/pull/713)
- Add button for creating a pull request on PR tree view [#709](https://github.com/Microsoft/vscode-pull-request-github/pull/709)
- Add "Suggest Edit" command [#688](https://github.com/Microsoft/vscode-pull-request-github/pull/688)
- Fix [#689](https://github.com/Microsoft/vscode-pull-request-github/issues/689), by [@JefferyCA], do not render markdown block comments
- Fix [#553](https://github.com/Microsoft/vscode-pull-request-github/issues/553), don't prevent checkout when there are unrelated working tree changes
- Fix [#576](https://github.com/Microsoft/vscode-pull-request-github/issues/576), handle GitHub enterprise behind a SSO wall

0.3.0

**Breaking Changes**

- From 0.3.0, you at least need VSCode 1.30 (including Insiders) to install and run the extension.

**Thank You**

* [Jeffrey (@JeffreyCA)](https://github.com/JeffreyCA)
  * Correct timestamp format [PR #686](https://github.com/Microsoft/vscode-pull-request-github/pull/686)
  * Render Markdown line breaks as <br> [PR #679](https://github.com/Microsoft/vscode-pull-request-github/pull/679)
  * Support absolute and relative timestamps [PR #644](https://github.com/Microsoft/vscode-pull-request-github/pull/644)

0.2.3
- Fix [#607], read `~/.ssh/config` to resolve hosts
- Fix [#572], by [@yoh1496], add support for GitHub Enterprise behind a proxy
- Fix [#658], ensure correct button enablement when reloading pending comment from cache
- Fix [#649], make sure selecting a different folder is responsive after adding it to the workspace

0.2.2

- Add support for editing and deleting comments [#107](https://github.com/Microsoft/vscode-pull-request-github/issues/107)
- Fix [#110](https://github.com/Microsoft/vscode-pull-request-github/issues/110), by [@JeffreyCA], add hyperlinks to timestamps
- Fix [#624](https://github.com/Microsoft/vscode-pull-request-github/issues/624), by [@JeffreyCA], improve comment header wording
- Fix [#568](https://github.com/Microsoft/vscode-pull-request-github/issues/568), by [@jerrymajewski], show author information in PR tooltip
- Fix [#543](https://github.com/Microsoft/vscode-pull-request-github/issues/543), by [@malwilley], preserve description page scroll position when focus changes
- Fix [#587](https://github.com/Microsoft/vscode-pull-request-github/issues/587), by [@mmanela], show correct error message for empty comment case
- Migrate hosts setting to `githubPullRequests` namespace, by [@wyze]
- Fix [#573](https://github.com/Microsoft/vscode-pull-request-github/issues/573), provide auth fallback when protocol handler fails

**Breaking Changes**

- From 0.2.0, you at least need VSCode 1.28 to install and run the extension.

**Fixes**

- Fix [#565](https://github.com/Microsoft/vscode-pull-request-github/issues/565), inline links in description page.
- Fix [#531](https://github.com/Microsoft/vscode-pull-request-github/issues/531) by [@wyze](https://github.com/wyze), state is incorrectly shown as Closed when it should be Merged
- Fix [#273](https://github.com/Microsoft/vscode-pull-request-github/issues/273), support ssh remotes.
- Fix [#537](https://github.com/Microsoft/vscode-pull-request-github/issues/537) by [@justinliew](https://github.com/justinliew), show pull request id in title.
- Fix [#491](https://github.com/Microsoft/vscode-pull-request-github/issues#491) by [@shatgupt](https://github.com/shatgupt), allow vertical resizing of comment box.
- Fix [#319](https://github.com/Microsoft/vscode-pull-request-github/issues#319), improve keyboard focus.
- Fix [#352](https://github.com/Microsoft/vscode-pull-request-github/issues/352) by [@Ikuyadeu](https://github.com/Ikuyadeu), support merging pull request
- Fix [#464](https://github.com/Microsoft/vscode-pull-request-github/issues/464) by [@wyze](https://github.com/wyze), show labels on PR description
- Fix [#562](https://github.com/Microsoft/vscode-pull-request-github/issues/562) by [@emtei](https://github.com/emtei), prevent PR creation date collision with subtitle

0.1.7

- Fix for native promise polyfill removal from VSCode extension host in Insiders 1.29

0.1.6
- Fix for [#500](https://github.com/Microsoft/vscode-pull-request-github/issues/500) and [#440](https://github.com/Microsoft/vscode-pull-request-github/issues/440), more lenient remote parsing
- Fix for [#383](https://github.com/Microsoft/vscode-pull-request-github/issues/383), move to github.com domain for the authentication server
- Fix for [#498](https://github.com/Microsoft/vscode-pull-request-github/issues/498), make sure comments gets updated on refresh event
- Fix for [#496](https://github.com/Microsoft/vscode-pull-request-github/issues/496), linkify urls on the description page
- FIx for [#507](https://github.com/Microsoft/vscode-pull-request-github/issues/507), loosen scope restrictions for older version of GitHub Enterprise

0.1.5
- Fix for [#449](https://github.com/Microsoft/vscode-pull-request-github/issues/449), authentication blocked when `docs-article-templates` extension is installed
- Fix for [#429](https://github.com/Microsoft/vscode-pull-request-github/issues/429), avoid unneccessary refreshes of the tree view

0.1.4
- Do not ship `.vscode-test/**` files

0.1.3
- Fix for [#382](https://github.com/Microsoft/vscode-pull-request-github/issues/382), authentication on enterprise servers without a `/rate_limit` path
- Fix for [#419](https://github.com/Microsoft/vscode-pull-request-github/issues/419), improve parsing of git remotes and show a warning if parse fails

0.1.2
- Fix for [#395](https://github.com/Microsoft/vscode-pull-request-github/issues/395), tree view not shown when the extension failed to parse a remote
- [#399](https://github.com/Microsoft/vscode-pull-request-github/issues/399), use `badge.foreground` color for PR status badge
- Fix for [#380](https://github.com/Microsoft/vscode-pull-request-github/issues/380), HTML content in diff on the overview was unescaped
- Fix for [#375](https://github.com/Microsoft/vscode-pull-request-github/issues/375), appropriately fetch more changed files in the tree view
