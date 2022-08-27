import Singleton from "../processor/di/annotations/Singleton";
import IHttpClient from "./IHttpClient";

@Singleton
export default class HttpClient implements IHttpClient {

    public constructor(private baseUrl: string) {
    }
    
    public get(url: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", `${this.baseUrl}${url}`);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    resolve(JSON.parse(xhr.response));
                }
                else {
                    reject(xhr.statusText);
                }
            };
            xhr.onerror = () => {
                reject(xhr.statusText);
            };
            xhr.send();
        });
    }
}