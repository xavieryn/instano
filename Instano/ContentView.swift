import SwiftUI

struct ContentView: View {
    var body: some View {
        ZStack {
            // Status-bar band matches the page background instead of black
            Color(uiColor: .systemBackground).ignoresSafeArea()
            WebView()
                .ignoresSafeArea(edges: .bottom)
        }
    }
}
