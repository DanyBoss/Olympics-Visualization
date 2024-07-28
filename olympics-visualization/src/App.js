import "./App.css";
import "./assets/css/fonts.css";
import MainComponent from "./components/main/MainComponent";
import { RecoilRoot } from 'recoil';

function App() {
  return (
    <div className="App">
      <RecoilRoot>
        <MainComponent />
      </RecoilRoot>
    </div>
  );
}

export default App;
