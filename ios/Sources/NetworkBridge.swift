import Foundation

// Local files have an opaque web origin. Only these existing app APIs may use native networking.
final class NetworkBridge: NSObject, URLSessionTaskDelegate {
    private lazy var session = URLSession(configuration: .ephemeral, delegate: self, delegateQueue: nil)
    private let endpoints: Set<String> = [
        "https://multiplicatingkid.pl/multiplayerinkdeck/api.php",
        "https://api.openai.com/v1/responses",
        "https://openrouter.ai/api/v1/chat/completions",
        "https://generativelanguage.googleapis.com/v1beta/interactions"
    ]

    func send(_ body: [String: Any], completion: @escaping (Int, String, String) -> Void) {
        guard let address = body["url"] as? String, endpoints.contains(address),
              let url = URL(string: address), body["method"] as? String == "POST" else {
            completion(0, "", "network"); return
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = min(90, max(1, (body["timeout"] as? Double ?? 15000) / 1000))
        request.httpBody = (body["body"] as? String ?? "").data(using: .utf8)
        for (key, value) in body["headers"] as? [String: String] ?? [:] {
            if ["content-type", "authorization", "x-goog-api-key"].contains(key.lowercased()) {
                request.setValue(value, forHTTPHeaderField: key)
            }
        }
        session.dataTask(with: request) { data, response, error in
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
            let kind = (error as? URLError)?.code == .timedOut ? "timeout" : (error == nil ? "" : "network")
            completion(status, text, kind)
        }.resume()
    }

    // Never forward room tokens or API keys to a redirected endpoint.
    func urlSession(_ session: URLSession, task: URLSessionTask,
                    willPerformHTTPRedirection response: HTTPURLResponse,
                    newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        completionHandler(nil)
    }
}
