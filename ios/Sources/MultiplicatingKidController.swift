import UIKit
import WebKit

// The complete existing service runs on its own HTTPS origin, with its own cookies.
// It never receives InkDeck's privileged local-file networking bridge or API keys.
final class MultiplicatingKidController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private var web: WKWebView!
    override func viewDidLoad() {
        super.viewDidLoad()
        title = "MultiplicatingKid"
        view.backgroundColor = .systemBackground
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        web = WKWebView(frame: .zero, configuration: config)
        web.translatesAutoresizingMaskIntoConstraints = false
        web.navigationDelegate = self
        web.uiDelegate = self
        view.addSubview(web)
        NSLayoutConstraint.activate([
            web.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor),
            web.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor),
            web.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            web.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
        ])
        navigationItem.leftBarButtonItem = UIBarButtonItem(title: "InkDeck", style: .done, target: self, action: #selector(close))
        navigationItem.rightBarButtonItems = [
            UIBarButtonItem(barButtonSystemItem: .refresh, target: self, action: #selector(refresh)),
            UIBarButtonItem(title: "Wstecz", style: .plain, target: self, action: #selector(back))
        ]
        web.load(URLRequest(url: URL(string: "https://multiplicatingkid.pl/webapp.php")!))
    }
    @objc private func close() { dismiss(animated: true) }
    @objc private func refresh() { web.reload() }
    @objc private func back() { if web.canGoBack { web.goBack() } }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        if url.scheme == "https", ["multiplicatingkid.pl", "www.multiplicatingkid.pl"].contains(url.host ?? ""),
           url.user == nil, url.password == nil, url.port == nil || url.port == 443 {
            decisionHandler(.allow)
        } else {
            if navigationAction.navigationType == .linkActivated, ["https", "mailto"].contains(url.scheme ?? "") { UIApplication.shared.open(url) }
            decisionHandler(.cancel)
        }
    }
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        if navigationAction.targetFrame == nil { webView.load(navigationAction.request) }
        return nil
    }
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        let alert = UIAlertController(title: "Brak połączenia", message: "Pełna gra wymaga internetu. Możesz ponowić lub wrócić do treningu offline w InkDeck.", preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Ponów", style: .default) { [weak self] _ in self?.refresh() })
        alert.addAction(UIAlertAction(title: "InkDeck", style: .cancel) { [weak self] _ in self?.close() })
        if presentedViewController == nil { present(alert, animated: true) }
    }
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "MultiplicatingKid", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() }); present(alert, animated: true)
    }
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "MultiplicatingKid", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Anuluj", style: .cancel) { _ in completionHandler(false) })
        alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) }); present(alert, animated: true)
    }
}
