/* reactとreact-domの読み込み */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/styles';
import theme from './theme';
import AudioEditor from "./audio-editor";
/** Bootstraping */
ReactDOM.render(
  <ThemeProvider theme={theme}>
  {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
  <CssBaseline />
  <AudioEditor />
  </ThemeProvider>,
    document.querySelector('#app')
  );