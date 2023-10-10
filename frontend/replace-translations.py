import os
import json

def replace_translations(file_path, directory='.'):
    with open(file_path, 'r') as f:
        translations_dict = json.loads(f.read())
        for k,v in translations_dict.items():
            print(f"replacing t('{k}') with '{v}'")
            for root, dirs, files in os.walk(directory):
                if '.git' in dirs:
                    dirs.remove('.git')
                for f in files:
                    if f.endswith('.ts') or f.endswith('.tsx') or f.endswith('.js') or f.endswith('.jsx'):
                        with open(os.path.join(root, f), 'r') as target:
                            print(os.path.join(root, f))
                            content = target.read()
                            modified = content.replace(f"t(\'{k}\')", f"\'{v}\'")

                        with open(os.path.join(root, f), 'w') as target:
                            target.write(modified)

if __name__ == '__main__':
    replace_translations('./public/locales/en.json', '.')