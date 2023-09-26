import { Provider } from "xray/webui";
import { BaseProvider } from "./core/provider";
class MyProvider extends BaseProvider { }
export function create(): Provider {
    return new MyProvider()
}