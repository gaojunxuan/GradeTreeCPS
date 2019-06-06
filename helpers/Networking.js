import { AsyncStorage } from 'react-native';

export default class Networking {

    static async refreshCookie() {
        var result = await AsyncStorage.getItem('refreshCookie');
        if(result == null)
            return false;
        else if(result == "true")
            return true;
        else if(result == "false")
            return false;
    }

    static async login(username, password) {
        const headers = { 'Content-Type': 'multipart/form-data', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        var form = new FormData();
        form.append("userEvent", 930);
        form.append("username", username);
        form.append("password", password);
        form.append("deploymentId", "aspen");
        var getResponse = await fetch("https://aspen.cps.edu/aspen/logon.do", { method: 'GET', headers: uaHeaders, credentials: 'include' });
        var token = (await getResponse.text()).match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1];
        form.append("org.apache.struts.taglib.html.TOKEN", token);
        var postResponse = await fetch("https://aspen.cps.edu/aspen/logon.do", { method: 'POST', body: form, headers: headers, credentials: 'include' });
    }
}